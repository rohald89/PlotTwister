import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, useLoaderData, type MetaFunction } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getMovie } from '#app/utils/tmdb.server.ts'

export async function loader({ params }: LoaderFunctionArgs) {
	const movie = await getMovie(params.movieId!)
	return json({ movie })
}

export default function MovieRoute() {
	const data = useLoaderData<typeof loader>()
	const movie = data.movie

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center">
			<Spacer size="4xs" />

			<div
				className="cover flex flex-col rounded-3xl bg-muted bg-cover bg-center"
				style={{
					backgroundImage: `url(https://image.tmdb.org/t/p/w780${movie.backdrop_path})`,
				}}
			>
				<div className="bg-backdrop-gradient-light dark:bg-backdrop-gradient-dark relative min-h-[400px] w-full rounded-3xl">
					<div className="absolute -top-40 left-10">
						<div className="relative flex items-center gap-6">
							<img
								className="rounded-sm"
								src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
								alt={movie.title}
							></img>
							<h1 className="text-h2">{movie.title}</h1>
						</div>
					</div>

					<div className="flex min-h-96 gap-8 p-8 pl-16 pt-10">
						<div className="mt-32 min-w-40 space-y-3">
							<div>
								<h2 className="text-sm font-bold">Release Date</h2>
								<p className="text-sm">{movie.release_date}</p>
							</div>
							<div>
								<h2 className="text-sm font-bold">Score</h2>
								<p className="text-sm">{movie.vote_average}/10</p>
							</div>
							<div>
								<h2 className="text-sm font-bold">Runtime</h2>
								<p className="text-sm">{movie.runtime} minutes</p>
							</div>
						</div>
						<div className="">{movie.overview}</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const movie = data?.movie
	return [
		{ title: `${movie?.title || 'Movie'} | PlotTwisters` },
		{
			name: 'description',
			content: `Movie details for ${movie?.title || 'the movie'} on PlotTwisters`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No movie with the id "{params.movieId}" exists</p>
				),
			}}
		/>
	)
}
