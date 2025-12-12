/**
 * Validates if a string is a valid HTTP or HTTPS URL.
 * @param url - The URL string to validate
 * @returns true if the URL is valid HTTP/HTTPS, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false
  }

  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
  } catch {
    return false
  }
}
