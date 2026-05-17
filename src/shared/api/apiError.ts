type ApiErrorBody = {
  error?: string
  provider?: string
}

type ErrorWithResponse = Error & {
  response: Response
}

function hasResponse(error: unknown): error is ErrorWithResponse {
  return error instanceof Error && 'response' in error && error.response instanceof Response
}

export async function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!hasResponse(error)) {
    return error instanceof Error ? error.message : fallbackMessage
  }

  let body: ApiErrorBody | null = null

  try {
    body = (await error.response.clone().json()) as ApiErrorBody
  } catch {
    body = null
  }

  if (error.response.status === 429) {
    const provider = body?.provider?.toLowerCase()
    const apiMessage = body?.error?.toLowerCase() ?? ''

    if (provider === 'gemini' || apiMessage.includes('quota')) {
      return 'Gemini quota or rate limit was reached. Please wait and try again later.'
    }

    return body?.error ?? 'Too many requests. Please try again later.'
  }

  if (error.response.status >= 500) {
    return body?.error ?? 'The backend service is temporarily unavailable.'
  }

  return body?.error ?? fallbackMessage
}
