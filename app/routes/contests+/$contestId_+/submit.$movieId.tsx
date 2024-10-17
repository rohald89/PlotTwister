import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import React from 'react'
import { prisma } from '#app/utils/db.server.ts'
import { AlternateEndingEditor } from '#app/routes/movies+/__ending-editor.tsx'
import { getMovie } from '#app/utils/tmdb.server.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { AlternateEndingEditorSchema } from '#app/routes/movies+/__ending-editor.tsx'

export async function loader({ params }: LoaderFunctionArgs) {
	const contest = await prisma.contest.findUnique({
		where: { id: params.contestId },
		include: { movies: true },
	})

	if (!contest) {
		throw new Response('Contest not found', { status: 404 })
	}

	const movie = contest.movies.find(
		(m) => m.tmdbMovieId === Number(params.movieId),
	)

	if (!movie) {
		throw new Response('Movie not found in this contest', { status: 404 })
	}

	const movieDetails = await getMovie(params.movieId!)

	return json({ contest, movie, movieDetails })
}

export async function action({ request, params }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	console.log('Received form data:', Object.fromEntries(formData))

	const result = AlternateEndingEditorSchema.safeParse(
		Object.fromEntries(formData),
	)

	if (!result.success) {
		console.error('Validation errors:', result.error.flatten())
		return json({ errors: result.error.flatten() }, { status: 400 })
	}

	const { title, content, tmdbMovieId } = result.data

	try {
		const alternateEnding = await prisma.alternateEnding.create({
			data: {
				title,
				content,
				tmdbMovieId,
				authorId: userId,
				contestEntry: {
					create: {
						contestId: params.contestId!,
					},
				},
			},
		})

		console.log('Created alternate ending:', alternateEnding)

		return redirect(`/contests/${params.contestId}`)
	} catch (error) {
		console.error('Error creating alternate ending:', error)
		return json(
			{ errors: { _form: ['An unexpected error occurred.'] } },
			{ status: 500 },
		)
	}
}

export default function SubmitContestEntry() {
	const { contest, movie, movieDetails } = useLoaderData<typeof loader>()

	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-4 text-2xl font-bold">
				Submit Alternate Ending for {movie.title}
			</h1>
			<div className="mb-4">
				<h2 className="text-xl font-semibold">Movie Details</h2>
				<p>
					<strong>Title:</strong> {movieDetails.title}
				</p>
				<p>
					<strong>Release Date:</strong> {movieDetails.release_date}
				</p>
				<p>
					<strong>Overview:</strong> {movieDetails.overview}
				</p>
			</div>
			<AlternateEndingEditor
				tmdbMovieId={movie.tmdbMovieId}
				movieTitle={movie.title}
			/>
		</div>
	)
}
