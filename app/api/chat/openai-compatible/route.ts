import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"

/**
 * Extracts error message from various error response formats.
 * Handles OpenAI-compatible API error responses.
 */
function extractErrorMessage(error: any): string {
  // Check for nested error object (common in OpenAI-compatible APIs)
  if (error?.error?.message) {
    return error.error.message
  }
  // Check for direct message property
  if (error?.message) {
    return error.message
  }
  // Check for response body error
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message
  }
  return "An unexpected error occurred"
}

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openai_compatible_api_key, "OpenAI Compatible")

    // Validate base URL is configured
    if (!profile.openai_compatible_base_url) {
      throw new Error(
        "OpenAI Compatible base URL not configured. Please set it in your profile settings."
      )
    }

    // Get model name from profile or use a default
    const modelName =
      profile.openai_compatible_model_name || chatSettings.model || "default"

    const openai = new OpenAI({
      apiKey: profile.openai_compatible_api_key || "",
      baseURL: profile.openai_compatible_base_url
    })

    const response = await openai.chat.completions.create({
      model: modelName as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      stream: true
    })

    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = extractErrorMessage(error)
    const errorCode = error.status || error.statusCode || 500

    // Handle connection errors
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      error.cause?.code === "ECONNREFUSED" ||
      error.cause?.code === "ENOTFOUND"
    ) {
      errorMessage =
        "Unable to connect to the endpoint. Please verify the URL is correct and the service is running."
    } else if (
      error.code === "ETIMEDOUT" ||
      error.cause?.code === "ETIMEDOUT"
    ) {
      errorMessage =
        "Connection timeout. Please check if the endpoint is accessible."
    }
    // Handle API key not found (from checkApiKey)
    else if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenAI Compatible API Key not found. Please set it in your profile settings."
    }
    // Handle authentication errors
    else if (errorCode === 401) {
      errorMessage =
        "Invalid API key. Please check your OpenAI Compatible API key in profile settings."
    } else if (errorCode === 403) {
      errorMessage =
        "Access denied. Please verify your API key has the required permissions."
    }
    // Handle base URL not configured
    else if (errorMessage.toLowerCase().includes("base url not configured")) {
      // Keep the original message
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}//
