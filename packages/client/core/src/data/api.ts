type AnyObject = Record<string, unknown>
type ApiErrorItem = { title: string; detail: string }

type LatitudeApiConfig = {
  host?: string
  cors?: RequestMode
  customHeaders?: Record<string, string>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

class LatitudeApi {
  private host?: string
  private cors: RequestMode = 'cors'
  private customHeaders: Record<string, string> = {}

  configure({ host, cors, customHeaders }: LatitudeApiConfig) {
    if (host !== undefined) this.host = host
    if (cors !== undefined) this.cors = cors
    if (customHeaders) this.customHeaders = customHeaders
  }

  async get<T>(
    urlStr: string,
    params: AnyObject = {},
    additionalHeaders: Record<string, string> = {},
  ): Promise<T> {
    const url = this.buildUrl(`${urlStr}`, params)
    const init = {
      method: 'GET',
      headers: this.buildHeaders({
        customHeaders: { ...this.customHeaders, ...additionalHeaders },
      }),
      mode: this.cors,
    } as RequestInit
    return await this.request(async () => {
      const res = await globalThis.window.fetch(url.href, init)
      return this.handleResponse<T>(res)
    })
  }

  private buildUrl(urlStr: string, params: AnyObject = {}) {
    const url = new URL(`${this.safeHost}/${urlStr}`)
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, String(params[key])),
    )

    return url
  }

  private get safeHost() {
    return this.host ?? globalThis.location.origin
  }

  private buildHeaders({
    customHeaders,
  }: {
    data?: AnyObject
    customHeaders: Record<string, string>
  }): HeadersInit {
    const headers = new Headers()

    headers.append('Content-Type', 'application/json')
    headers.append('Accept', 'application/json')

    Object.keys(customHeaders).forEach((key) =>
      headers.append(key, customHeaders[key]!),
    )

    return headers
  }

  private async request<T>(fn: () => Promise<T>) {
    return await fn()
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) return response.json()

    let errorMessage = 'Unexpected API error'
    if (response.status >= 500) {
      errorMessage = await response.text()
    } else {
      try {
        const json = await response.json()
        if (json.errors) {
          errorMessage = json.errors.map((e: ApiErrorItem) => e.detail).join(', ')
        }
      } catch (e) {
        errorMessage = 'Error parsing API response'
      }
    }

    throw new ApiError(errorMessage, response.status)
  }
}

export const api = new LatitudeApi()