import { json, type ActionFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserId } from '#app/utils/auth.server.ts'

export async function action({ request, params }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const { movieId } = params

	if (!movieId) {
		return json({ error: 'Movie ID is required' }, { status: 400 })
	}

	const tmdbMovieId = parseInt(movieId, 10)

	if (isNaN(tmdbMovieId)) {
		return json({ error: 'Invalid Movie ID' }, { status: 400 })
	}

	const existingLike = await prisma.movieLike.findUnique({
		where: {
			userId_tmdbMovieId: {
				userId,
				tmdbMovieId,
			},
		},
	})

	if (existingLike) {
		await prisma.movieLike.delete({
			where: { id: existingLike.id },
		})
		return json({ liked: false })
	} else {
		await prisma.movieLike.create({
			data: {
				userId,
				tmdbMovieId,
			},
		})
		return json({ liked: true })
	}
}
