import { NotFoundError } from '@latitude-data/source-manager'

export default function handleError(e: Error) {
  const isPro = import.meta.env.PROD
  const clientError = isPro
    ? new Error('There was an error in this query')
    : (e as Error)
  if (clientError instanceof NotFoundError) {
    return new Response(e.message, { status: 404 })
  }

  // TODO: Add sentry reporting
  console.error(e)

  return new Response(clientError.message, { status: 500 })
}
