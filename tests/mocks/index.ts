import closeWithGrace from 'close-with-grace'
import { passthrough, http } from 'msw'
import { setupServer } from 'msw/node'
import { handlers as githubHandlers } from './github.ts'
import { handlers as resendHandlers } from './resend.ts'
import { createTmdbHandlers } from './tmdb.ts'

const tmdbApiKey = process.env.TMDB_API_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

const miscHandlers = [
    http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
        if (openaiApiKey) {
            return passthrough()
        }

        // Mock response
        return new Response(
            JSON.stringify({
                choices: [
                    {
                        message: {
                            content: 'Mocked OpenAI response',
                        },
                    },
                ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    }),
].filter(Boolean)

const allHandlers = [
  ...miscHandlers,
  ...resendHandlers,
  ...githubHandlers,
  ...(tmdbApiKey ? [] : createTmdbHandlers()),
]

export const server = setupServer(...allHandlers)

server.listen({
  onUnhandledRequest(request, print) {
    // Do not print warnings on unhandled requests to https://<:userId>.ingest.us.sentry.io/api/
    if (request.url.includes('.sentry.io')) {
      return
    }

    // Do not print warnings for TMDB API requests (in case some are not mocked)
    if (request.url.includes('api.themoviedb.org')) {
      if (!tmdbApiKey) {
        // If API key is undefined, we're mocking these requests, so don't warn
        return
      }
      // If API key is defined, we're not mocking, so allow the warning
    }

    // Print the regular MSW unhandled request warning otherwise.
    print.warning()
  },
})

if (process.env.NODE_ENV !== 'test') {
  console.info('🔶 Mock server installed')

  closeWithGrace(() => {
    server.close()
  })
}
