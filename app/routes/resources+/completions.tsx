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
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { name: true, username: true },
	})
	if (!user) {
		await authenticator.logout(request, { redirectTo: '/' })
		return new Response(null, { status: 401 })
	}
	const url = new URL(request.url)
	const type = url.searchParams.get('type')
	const movieTitle = url.searchParams.get('movieTitle')
	const prompt = url.searchParams.get('prompt')

	invariant(
		type && movieTitle && prompt,
		'Must provide type, movieTitle, and prompt',
	)

	const messages: Array<ChatCompletionMessageParam> = [
		{
			role: 'system',
			content: `You are a creative assistant specializing in generating alternate movie endings. Be imaginative, surprising, and engaging. The user will provide the original movie title and a prompt for the alternate ending. Avoid using words like "instead", "alternate", "ending", "movie", "Our story", "Our movie", etc. keep it strictly to the story of what would have happened in the movie if the original ending was different, and instead the prompt happened. Only output the title or the content of the alternate ending, nothing else, never return both. Don't use quotes in your response.`,
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
	return eventStream(controller.signal, function setup(send) {
		async function handleStream() {
			try {
				for await (const part of stream) {
					const delta = part.choices[0]?.delta?.content?.replace(/\n/g, '␣')
					if (delta) send({ data: delta })
				}
			} catch (error) {
				console.error('Error in OpenAI stream:', error)
				send({ event: 'error', data: 'An error occurred' })
			} finally {
				send({ event: 'done', data: '' })
			}
		}
		handleStream().then(
			() => controller.abort(),
			() => controller.abort(),
		)
		return function clear() {}
	}, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		},
	})
}
