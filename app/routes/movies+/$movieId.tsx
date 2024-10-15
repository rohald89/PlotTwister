import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate, type MetaFunction } from '@remix-run/react'
import { useState, useRef } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#app/components/ui/accordion'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs.js'
import { prisma } from '#app/utils/db.server.ts'
import {
	formatRuntime,
	formatVoteCount,
	getReleaseYear,
} from '#app/utils/misc.js'
import { getMovie } from '#app/utils/tmdb.server.ts'
import { AlternateEndingEditor } from './__ending-editor'

export async function loader({ params }: LoaderFunctionArgs) {
	const movie = await getMovie(params.movieId!)
	console.log(movie)
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
		<>
			<div
				className="flex h-[480px] flex-col rounded-b-3xl bg-muted bg-cover bg-center"
				style={{
					backgroundImage: `url(https://image.tmdb.org/t/p/w780${movie.backdrop_path})`,
				}}
			>
				<div className="relative h-full w-full bg-backdrop-gradient-light dark:bg-backdrop-gradient-dark">
					<div className="container flex h-full flex-col justify-between py-8 lg:px-24">
						<Button
							variant="link"
							onClick={() => navigate(-1)}
							className="mb-4 self-start"
						>
							<Icon name="arrow-left" className="mr-2" />
							Back
						</Button>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="relative h-16 w-16">
									<svg className="h-full w-full" viewBox="0 0 36 36">
										<path
											d="M18 2.0845
										a 15.9155 15.9155 0 0 1 0 31.831
										a 15.9155 15.9155 0 0 1 0 -31.831"
											fill="none"
											stroke="currentColor"
											strokeWidth="3"
											strokeDasharray={`${movie.vote_average * 10}, 100`}
											className="stroke-primary"
										/>
									</svg>
									<div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
										{movie.vote_average.toFixed(1)}
									</div>
								</div>
								<div>
									<p className="text-h6">
										{formatVoteCount(movie.vote_count)} Votes
									</p>
									<p className="text-body-xs opacity-80">
										Our Users Are Recommending This Movie
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="container flex gap-10 py-16 lg:px-24">
				<div className="flex flex-1 flex-col gap-10">
					<div className="flex gap-10">
						<img
							className="w-32 rounded-sm"
							src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`}
							alt={movie.title}
						></img>
						<div className="flex flex-col justify-between gap-4">
							<h1 className="text-h2">{movie.title}</h1>
							<div className="flex gap-2 text-foreground opacity-60">
								{movie.genres.map((genre) => (
									<p
										key={genre.id}
										className="rounded-full px-6 py-2 text-white outline outline-1 outline-foreground"
									>
										{genre.name}
									</p>
								))}
							</div>
							<div className="flex gap-2">
								<Button
									size="xl"
									variant="secondary"
									className="rounded-full bg-indigo-600 px-12 py-8 text-xl"
								>
									<Icon name="play" className="mr-6" />
									Watch
								</Button>
								<Button
									size="xl"
									variant="outline"
									className="rounded-full px-6 py-8 text-xl"
								>
									<Icon name="heart" />
								</Button>
								<Button
									size="xl"
									variant="outline"
									className="rounded-full px-6 py-8 text-xl"
								>
									<Icon name="share" />
								</Button>
								<Button
									size="xl"
									variant="outline"
									className="rounded-full px-6 py-8 text-xl"
								>
									<Icon name="dots-horizontal" />
								</Button>
							</div>
						</div>
					</div>

					<div className="flex gap-10">
						<div className="w-32 uppercase">
							<p className="text-h6">{getReleaseYear(movie.release_date)}</p>
							<p className="text-h6">{formatRuntime(movie.runtime)}</p>
							<p className="text-h6">PG13</p>
						</div>
						<div className="flex-1">
							<Tabs defaultValue="story" className="w-[400px]">
								<TabsList>
									<TabsTrigger value="story">Storyline</TabsTrigger>
									<TabsTrigger value="alternate">Alternate Endings</TabsTrigger>
									<TabsTrigger value="new">New</TabsTrigger>
								</TabsList>
								<TabsContent value="story">{movie.overview}</TabsContent>
								<TabsContent value="alternate">
									<div className="flex flex-col gap-4">
										<Accordion type="single" collapsible>
											{data.alternateEndings.map((ending) => (
												<AccordionItem key={ending.id} value={ending.id}>
													<AccordionTrigger>
														<>
															{ending.title}
															<i>by {ending.author.username}</i>
														</>
													</AccordionTrigger>
													<AccordionContent>{ending.content}</AccordionContent>
												</AccordionItem>
											))}
										</Accordion>
									</div>
								</TabsContent>
								<TabsContent value="new">
									<AlternateEndingEditor
										tmdbMovieId={Number(movie.id)}
										movieTitle={movie.title}
									/>
								</TabsContent>
							</Tabs>
						</div>
						<div className="w-1/4">
							<h2 className="mb-4 text-h6">Cast</h2>
							<div className="flex flex-col gap-4">
								{movie.credits?.cast.slice(0, 5).map((cast) => (
									<div key={cast.id} className="flex items-center gap-4">
										<img
											className="aspect-square h-20 w-20 rounded-full object-cover"
											src={`https://image.tmdb.org/t/p/w185${cast.profile_path}`}
											alt={cast.name}
										></img>
										<div>
											<p>{cast.name}</p>
											<p className="text-body-xs opacity-60">
												{cast.character}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
				<div className="w-1/5 border-l-2 border-muted-foreground px-4">
					<h2 className="text-h6">More like this</h2>
				</div>
			</div>
		</>
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
