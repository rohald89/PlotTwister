import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate, type MetaFunction } from '@remix-run/react'
import { useState, useRef } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getMovie } from '#app/utils/tmdb.server.ts'
import { AlternateEndingEditor } from './__ending-editor'

export async function loader({ params }: LoaderFunctionArgs) {
	const movie = await getMovie(params.movieId!)
	const alternateEndings = await prisma.alternateEnding.findMany({
		select: {
			id: true,
			title: true,
			content: true,
			author: true,
		},
		where: {
			tmdbMovieId: Number(params.movieId),
		},
	})

	return json({ movie, alternateEndings })
}

export { action } from './__ending-editor.server'

export default function MovieRoute() {
	const data = useLoaderData<typeof loader>()
	const movie = data.movie
	const navigate = useNavigate()
	const [showEditor, setShowEditor] = useState(false)
	const editorRef = useRef<HTMLDivElement>(null)

	return (
		<div className="container mb-48 mt-4 flex flex-col items-center justify-center">
			<Button
				variant="ghost"
				onClick={() => navigate(-1)}
				className="mb-4 self-start"
			>
				<Icon name="arrow-left" className="mr-2" />
				Back
			</Button>

			<Spacer size="4xl" />

			<div
				className="cover flex flex-col rounded-3xl bg-muted bg-cover bg-center"
				style={{
					backgroundImage: `url(https://image.tmdb.org/t/p/w780${movie.backdrop_path})`,
				}}
			>
				<div className="relative min-h-[400px] w-full rounded-3xl bg-backdrop-gradient-light dark:bg-backdrop-gradient-dark">
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

			<div className="w-full max-w-3xl">
				<div className="flex items-center justify-between">
					<h2 className="text-h3">Alternate Endings</h2>
					<Button
						onClick={() => {
							setShowEditor(true)
							setTimeout(
								() => editorRef.current?.scrollIntoView({ behavior: 'smooth' }),
								0,
							)
						}}
					>
						Create New Ending
					</Button>
				</div>
				{data.alternateEndings.map((ending) => (
					<div key={ending.id} className="my-4 rounded-lg border p-4">
						<h3 className="text-h4">{ending.title}</h3>
						<p className="mb-3 italic">by {ending.author.username}</p>
						<p>{ending.content}</p>
					</div>
				))}
			</div>

			{showEditor && (
				<div ref={editorRef} className="mt-8 w-full max-w-3xl">
					<h2 className="mb-4 text-h3">
						{data.alternateEndings.length === 0 ? 'Create' : 'Add'} Alternate
						Ending
					</h2>
					<AlternateEndingEditor
						tmdbMovieId={Number(movie.id)}
						movieTitle={movie.title}
					/>
				</div>
			)}
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
