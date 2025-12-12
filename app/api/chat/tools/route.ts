import { openapiToFunctions } from "@/lib/openapi-conversion"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import {
  tavilySearch,
  TavilySearchError,
  TavilySearchResponse
} from "@/lib/tools/tavily-search"
import {
  getTavilySearchTool,
  formatSearchResults
} from "@/lib/tools/tavily-tool-definition"
import { Tables } from "@/supabase/types"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

/**
 * Determines the provider from the model ID
 */
function getProviderFromModel(model: string): string {
  if (model === "openai-compatible" || model.startsWith("openai-compatible")) {
    return "openai-compatible"
  }
  if (
    model.startsWith("gpt-") ||
    model.startsWith("o1") ||
    model.startsWith("o3")
  ) {
    return "openai"
  }
  if (model.startsWith("claude-")) {
    return "anthropic"
  }
  if (model.startsWith("gemini-")) {
    return "google"
  }
  if (model.startsWith("mistral-") || model.startsWith("mixtral-")) {
    return "mistral"
  }
  if (
    model.startsWith("llama") ||
    model.startsWith("gemma") ||
    model.includes("groq")
  ) {
    return "groq"
  }
  // Default to openai for unknown models
  return "openai"
}

/**
 * Creates an OpenAI client configured for the appropriate provider
 */
function createOpenAIClient(
  provider: string,
  profile: Tables<"profiles">
): { client: OpenAI; modelName: string } {
  switch (provider) {
    case "openai-compatible":
      if (!profile.openai_compatible_api_key) {
        throw new Error("OpenAI Compatible API Key not found")
      }
      if (!profile.openai_compatible_base_url) {
        throw new Error("OpenAI Compatible base URL not configured")
      }
      return {
        client: new OpenAI({
          apiKey: profile.openai_compatible_api_key,
          baseURL: profile.openai_compatible_base_url
        }),
        modelName: profile.openai_compatible_model_name || "default"
      }

    case "groq":
      if (!profile.groq_api_key) {
        throw new Error("Groq API Key not found")
      }
      return {
        client: new OpenAI({
          apiKey: profile.groq_api_key,
          baseURL: "https://api.groq.com/openai/v1"
        }),
        modelName: ""
      }

    case "mistral":
      if (!profile.mistral_api_key) {
        throw new Error("Mistral API Key not found")
      }
      return {
        client: new OpenAI({
          apiKey: profile.mistral_api_key,
          baseURL: "https://api.mistral.ai/v1"
        }),
        modelName: ""
      }

    case "openai":
    default:
      if (!profile.openai_api_key) {
        throw new Error("OpenAI API Key not found")
      }
      return {
        client: new OpenAI({
          apiKey: profile.openai_api_key,
          organization: profile.openai_organization_id
        }),
        modelName: ""
      }
  }
}

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages, selectedTools } = json as {
    chatSettings: ChatSettings
    messages: any[]
    selectedTools: Tables<"tools">[]
  }

  try {
    const profile = await getServerProfile()

    // Determine provider from model
    const provider = getProviderFromModel(chatSettings.model)

    // Debug logging
    console.log(
      `[Tools Route] Model: ${chatSettings.model}, Detected Provider: ${provider}`
    )

    // Create OpenAI-compatible client for the provider
    const { client: openai, modelName: providerModelName } = createOpenAIClient(
      provider,
      profile
    )

    // Use provider-specific model name or the one from chat settings
    const modelToUse = providerModelName || chatSettings.model

    // Check if Tavily API key is configured and web search is enabled in chat settings
    const tavilyApiKey = profile.tavily_api_key
    const isTavilyEnabled =
      tavilyApiKey &&
      tavilyApiKey.trim() !== "" &&
      chatSettings.enableWebSearch === true

    let allTools: OpenAI.Chat.Completions.ChatCompletionTool[] = []
    let allRouteMaps = {}
    let schemaDetails = []

    // Add Tavily web_search tool if API key is configured (Requirements 2.1, 5.1)
    if (isTavilyEnabled) {
      allTools.push(getTavilySearchTool())
    }

    for (const selectedTool of selectedTools) {
      try {
        const convertedSchema = await openapiToFunctions(
          JSON.parse(selectedTool.schema as string)
        )
        const tools = convertedSchema.functions || []
        allTools = allTools.concat(tools)

        const routeMap = convertedSchema.routes.reduce(
          (map: Record<string, string>, route) => {
            map[route.path.replace(/{(\w+)}/g, ":$1")] = route.operationId
            return map
          },
          {}
        )

        allRouteMaps = { ...allRouteMaps, ...routeMap }

        schemaDetails.push({
          title: convertedSchema.info.title,
          description: convertedSchema.info.description,
          url: convertedSchema.info.server,
          headers: selectedTool.custom_headers,
          routeMap,
          requestInBody: convertedSchema.routes[0].requestInBody
        })
      } catch (error: any) {
        console.error("Error converting schema", error)
      }
    }

    const firstResponse = await openai.chat.completions.create({
      model: modelToUse as ChatCompletionCreateParamsBase["model"],
      messages,
      tools: allTools.length > 0 ? allTools : undefined
    })

    const message = firstResponse.choices[0].message
    messages.push(message)
    const toolCalls = message.tool_calls || []

    if (toolCalls.length === 0) {
      return new Response(message.content, {
        headers: {
          "Content-Type": "application/json"
        }
      })
    }

    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const functionCall = toolCall.function
        const functionName = functionCall.name
        const argumentsString = toolCall.function.arguments.trim()
        const parsedArgs = JSON.parse(argumentsString)

        // Handle Tavily web_search tool (Requirements 2.2, 2.3)
        if (functionName === "web_search" && isTavilyEnabled && tavilyApiKey) {
          let toolResult: string

          try {
            const searchResponse: TavilySearchResponse = await tavilySearch(
              tavilyApiKey,
              { query: parsedArgs.query }
            )

            const formattedResults = formatSearchResults(searchResponse.results)

            // Include results and sources for the model to use in response
            toolResult = JSON.stringify({
              results: formattedResults.results,
              sources: formattedResults.sources
            })
          } catch (error) {
            // Graceful degradation: log error and continue without search results (Requirement 4.4)
            // The conversation continues even when search fails - model receives error info
            // and can respond appropriately without blocking the user
            if (error instanceof TavilySearchError) {
              const errorContext = {
                type: error.isAuthError
                  ? "authentication"
                  : error.isConnectionError
                    ? "connection"
                    : "api",
                statusCode: error.statusCode
              }
              console.error(
                `[Tavily] Search failed - Type: ${errorContext.type}, Status: ${errorContext.statusCode}, Message: ${error.message}, Query: "${parsedArgs.query}"`
              )
              toolResult = JSON.stringify({
                error: error.message,
                errorType: errorContext.type,
                results: [],
                sources: "",
                note: "Search was unavailable. Please respond based on your existing knowledge."
              })
            } else {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error"
              console.error(
                `[Tavily] Unexpected search error - Message: ${errorMessage}, Query: "${parsedArgs.query}"`,
                error
              )
              toolResult = JSON.stringify({
                error: "Search service temporarily unavailable",
                errorType: "unexpected",
                results: [],
                sources: "",
                note: "Search was unavailable. Please respond based on your existing knowledge."
              })
            }
          }

          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: toolResult
          })

          continue
        }

        // Handle OpenAPI-based tools
        // Find the schema detail that contains the function name
        const schemaDetail = schemaDetails.find(detail =>
          Object.values(detail.routeMap).includes(functionName)
        )

        if (!schemaDetail) {
          throw new Error(`Function ${functionName} not found in any schema`)
        }

        const pathTemplate = Object.keys(schemaDetail.routeMap).find(
          key => schemaDetail.routeMap[key] === functionName
        )

        if (!pathTemplate) {
          throw new Error(`Path for function ${functionName} not found`)
        }

        const path = pathTemplate.replace(/:(\w+)/g, (_, paramName) => {
          const value = parsedArgs.parameters[paramName]
          if (!value) {
            throw new Error(
              `Parameter ${paramName} not found for function ${functionName}`
            )
          }
          return encodeURIComponent(value)
        })

        if (!path) {
          throw new Error(`Path for function ${functionName} not found`)
        }

        // Determine if the request should be in the body or as a query
        const isRequestInBody = schemaDetail.requestInBody
        let data = {}

        if (isRequestInBody) {
          // If the type is set to body
          let headers = {
            "Content-Type": "application/json"
          }

          // Check if custom headers are set
          const customHeaders = schemaDetail.headers // Moved this line up to the loop
          // Check if custom headers are set and are of type string
          if (customHeaders && typeof customHeaders === "string") {
            let parsedCustomHeaders = JSON.parse(customHeaders) as Record<
              string,
              string
            >

            headers = {
              ...headers,
              ...parsedCustomHeaders
            }
          }

          const fullUrl = schemaDetail.url + path

          const bodyContent = parsedArgs.requestBody || parsedArgs

          const requestInit = {
            method: "POST",
            headers,
            body: JSON.stringify(bodyContent) // Use the extracted requestBody or the entire parsedArgs
          }

          const response = await fetch(fullUrl, requestInit)

          if (!response.ok) {
            data = {
              error: response.statusText
            }
          } else {
            data = await response.json()
          }
        } else {
          // If the type is set to query
          const queryParams = new URLSearchParams(
            parsedArgs.parameters
          ).toString()
          const fullUrl =
            schemaDetail.url + path + (queryParams ? "?" + queryParams : "")

          let headers = {}

          // Check if custom headers are set
          const customHeaders = schemaDetail.headers
          if (customHeaders && typeof customHeaders === "string") {
            headers = JSON.parse(customHeaders)
          }

          const response = await fetch(fullUrl, {
            method: "GET",
            headers: headers
          })

          if (!response.ok) {
            data = {
              error: response.statusText
            }
          } else {
            data = await response.json()
          }
        }

        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(data)
        })
      }
    }

    const secondResponse = await openai.chat.completions.create({
      model: modelToUse as ChatCompletionCreateParamsBase["model"],
      messages,
      stream: true
    })

    const stream = OpenAIStream(secondResponse)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    console.error(error)
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
