/**
 * Tavily Web Search Tool Definition
 *
 * This module defines the web_search tool for OpenAI function calling,
 * enabling LLMs to search the web for current information.
 */

import OpenAI from "openai"

/**
 * Tool definition for web search using Tavily API.
 * This tool allows the model to search the web for current information.
 */
export const tavilySearchTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "Search the web for current information about a topic. Use this when you need up-to-date information or facts you don't know.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find information about"
        }
      },
      required: ["query"]
    }
  }
}

/**
 * Returns the Tavily search tool definition.
 * Use this function to get the tool for inclusion in chat completion requests.
 */
export function getTavilySearchTool(): OpenAI.Chat.Completions.ChatCompletionTool {
  return tavilySearchTool
}

/**
 * Formatted search result for display
 */
export interface FormattedSearchResult {
  title: string
  url: string
  snippet: string
}

/**
 * Response from formatting search results
 */
export interface SearchToolResponse {
  results: FormattedSearchResult[]
  sources: string
}

/**
 * Formats search results with citations for display.
 * Each source includes title and URL as required by Requirements 3.1, 3.2, 3.3.
 *
 * @param results - Array of search results from Tavily API
 * @returns Formatted response with results and citation string
 */
export function formatSearchResults(
  results: Array<{ title: string; url: string; content: string }>
): SearchToolResponse {
  const formattedResults: FormattedSearchResult[] = results.map(result => ({
    title: result.title,
    url: result.url,
    snippet: result.content
  }))

  const sources = results
    .map((result, index) => `[${index + 1}] ${result.title} - ${result.url}`)
    .join("\n")

  return {
    results: formattedResults,
    sources
  }
}
