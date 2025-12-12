/**
 * Tavily AI Search Service
 *
 * This module provides integration with the Tavily AI Search API,
 * which is optimized for AI agents and LLMs.
 */

export interface TavilySearchParams {
  query: string
  searchDepth?: "basic" | "advanced"
  maxResults?: number
}

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

export interface TavilySearchResponse {
  results: TavilySearchResult[]
  query: string
}

export interface TavilyErrorResponse {
  error?: {
    message?: string
  }
  message?: string
  detail?: string
}

export class TavilySearchError extends Error {
  public readonly statusCode: number
  public readonly isAuthError: boolean
  public readonly isConnectionError: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    isAuthError: boolean = false,
    isConnectionError: boolean = false
  ) {
    super(message)
    this.name = "TavilySearchError"
    this.statusCode = statusCode
    this.isAuthError = isAuthError
    this.isConnectionError = isConnectionError
  }
}

const TAVILY_API_URL = "https://api.tavily.com/search"

/**
 * Extracts error message from Tavily API error response
 */
export function extractErrorMessage(errorBody: TavilyErrorResponse): string {
  if (errorBody.error?.message) {
    return errorBody.error.message
  }
  if (errorBody.message) {
    return errorBody.message
  }
  if (errorBody.detail) {
    return errorBody.detail
  }
  return "Unknown error occurred"
}

/**
 * Performs a web search using the Tavily AI Search API
 *
 * @param apiKey - The Tavily API key
 * @param params - Search parameters including query, depth, and max results
 * @returns Search response with results and query
 * @throws TavilySearchError on API errors or connection failures
 */
export async function tavilySearch(
  apiKey: string,
  params: TavilySearchParams
): Promise<TavilySearchResponse> {
  const { query, searchDepth = "basic", maxResults = 5 } = params

  const requestBody = {
    api_key: apiKey,
    query,
    search_depth: searchDepth,
    max_results: maxResults,
    include_answer: false,
    include_raw_content: false
  }

  let response: Response

  try {
    response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })
  } catch (error) {
    throw new TavilySearchError(
      "Unable to connect to search service",
      0,
      false,
      true
    )
  }

  if (!response.ok) {
    let errorMessage: string

    if (response.status === 401) {
      throw new TavilySearchError(
        "Invalid Tavily API key. Please check your API key in settings.",
        401,
        true,
        false
      )
    }

    try {
      const errorBody: TavilyErrorResponse = await response.json()
      errorMessage = extractErrorMessage(errorBody)
    } catch {
      errorMessage = response.statusText || "Unknown error occurred"
    }

    throw new TavilySearchError(errorMessage, response.status, false, false)
  }

  const data = await response.json()

  return {
    results: (data.results || []).map((result: any) => ({
      title: result.title || "",
      url: result.url || "",
      content: result.content || "",
      score: result.score || 0
    })),
    query: data.query || query
  }
}
