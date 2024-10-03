import { invariant } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from '@remix-run/node'
import OpenAI from 'openai'
import { type ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import { eventStream } from 'remix-utils/sse/server'
import { authenticator, requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'

const apiKey = process.env.OPENAI_API_KEY || 'dummy-key'

const openai = new OpenAI({
	apiKey: apiKey,
})
export async function loader({ request }: LoaderFunctionArgs) {
	console.log('Completions loader called')
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { name: true, username: true },
	})
	if (!user) {
		console.log('User not found')
		await authenticator.logout(request, { redirectTo: '/' })
		return new Response(null, { status: 401 })
	}
	const url = new URL(request.url)
	const type = url.searchParams.get('type')
	const movieTitle = url.searchParams.get('movieTitle')
	const prompt = url.searchParams.get('prompt')

	console.log('Request parameters:', { type, movieTitle, prompt })

	try {
		invariant(
			type && movieTitle && prompt,
			'Must provide type, movieTitle, and prompt',
		)
	} catch (error) {
		console.error('Invariant check failed:', error)
		return new Response('Invalid request parameters', { status: 400 })
	}

	const messages: Array<ChatCompletionMessageParam> = [
		{
			role: 'system',
			content: `You are a creative assistant specializing in generating alternate movie endings. Be imaginative, surprising, and engaging. The user will provide the original movie title and a prompt for the alternate ending. Avoid using words like "instead", "alternate", "ending", "movie", "Our story", "Our movie", etc. keep it strictly to the story of what would have happened in the movie if the original ending was different, and instead the prompt happened. Only output the title or the content of the alternate ending, nothing else, never return both. Don't use quotes in your response, stick to a maximum of 100 characters for titles and 150 words for the content.`,
		},
		{
			role: 'user',
			content: `Original movie: "${movieTitle}". Alternate ending prompt: "${prompt}". ${
				type === 'title'
					? 'Generate a catchy and intriguing title for this alternate ending.'
					: 'Write a detailed and engaging alternate ending based on this prompt.'
			}`,
		},
	]

	const stream = await openai.chat.completions.create({
		model: 'gpt-4',
		messages,
		temperature: 1.0, // Increased for more creativity
		max_tokens: type === 'title' ? 50 : 500,
		stream: true,
	})

	const controller = new AbortController()
	request.signal.addEventListener('abort', () => {
		controller.abort()
	})
	return eventStream(
		controller.signal,
		function setup(send) {
			async function handleStream() {
				try {
					console.log('Starting OpenAI stream')
					for await (const part of stream) {
						const delta = part.choices[0]?.delta?.content?.replace(/\n/g, '␣')
						if (delta) {
							console.log('Sending delta:', delta)
							send({ data: delta })
						}
					}
				} catch (error) {
					console.error('Error in OpenAI stream:', error)
					send({ event: 'error', data: 'An error occurred' })
				} finally {
					console.log('Stream finished')
					send({ event: 'done', data: '' })
				}
			}
			handleStream().then(
				() => controller.abort(),
				(error) => {
					console.error('handleStream error:', error)
					controller.abort()
				},
			)
			return function clear() {
				console.log('SSE connection closed')
			}
		},
		{
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
			},
		},
	)
}
