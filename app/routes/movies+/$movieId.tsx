import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
	useLoaderData,
	useNavigate,
	type MetaFunction,
	useLocation,
	useFetcher,
	Link,
} from '@remix-run/react'
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
	cn,
	formatRuntime,
	formatVoteCount,
	getReleaseYear,
} from '#app/utils/misc.js'
import { getMovie, MovieListItem } from '#app/utils/tmdb.server.ts'
import { AlternateEndingEditor } from './__ending-editor'
import { useToast } from '#app/components/toaster'
import { requireUserId } from '#app/utils/auth.server.ts'
import { Toast } from '#app/utils/toast.server.js'
import { MovieTrailerDialog } from '#app/components/movietrailer-dialog'
import { WatchProvidersDialog } from '#app/components/watch-provider-dialog'
import { ScrollArea } from '#app/components/ui/scroll-area.js'

function useLike(initialLiked: boolean) {
	const likeFetcher = useFetcher()
	const liked = likeFetcher.formData
		? likeFetcher.formData.get('liked') === 'true'
		: initialLiked

	const handleLike = (movieId: number) => {
		likeFetcher.submit(null, {
			method: 'post',
			action: `/api/movies/${movieId}/like`,
		})
	}

	return { liked, handleLike }
}

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const movie = await getMovie(params.movieId!)
	const alternateEndings = await prisma.alternateEnding.findMany({
		where: { tmdbMovieId: Number(params.movieId) },
		include: { author: { select: { username: true } } },
	})
	const isLiked = await prisma.movieLike.findUnique({
		where: {
			userId_tmdbMovieId: {
				userId,
				tmdbMovieId: Number(params.movieId),
			},
		},
	})

	// Find the first trailer in the videos array
	const trailer = movie.videos?.results.find(
		(video) => video.type === 'Trailer' && video.site === 'YouTube',
	)
	console.log(movie)

	return json({
		movie,
		alternateEndings,
		isLiked: !!isLiked,
		trailerKey: trailer?.key,
	})
}

export { action } from './__ending-editor.server'

export default function MovieRoute() {
	const { movie, isLiked, alternateEndings, trailerKey } =
		useLoaderData<typeof loader>()

	const { liked, handleLike } = useLike(isLiked)
	const navigate = useNavigate()
	const location = useLocation()
	const [toast, setToast] = useState<Toast | null>(null)
	useToast(toast)
	const [isTrailerDialogOpen, setIsTrailerDialogOpen] = useState(false)
	const [isWatchProvidersDialogOpen, setIsWatchProvidersDialogOpen] =
		useState(false)
	const [activeTab, setActiveTab] = useState('story')

	const [showEditor, setShowEditor] = useState(false)
	const editorRef = useRef<HTMLDivElement>(null)

	const handleShare = () => {
		const currentUrl = `${window.location.origin}${location.pathname}`
		navigator.clipboard.writeText(currentUrl).then(
			() => {
				setToast({
					id: 'share-success',
					title: 'URL Copied!',
					description: 'The movie link has been copied to your clipboard.',
					type: 'success',
				})
			},
			() => {
				setToast({
					id: 'share-error',
					title: 'Copy Failed',
					description: 'Failed to copy the URL. Please try again.',
					type: 'error',
				})
			},
		)
	}

	return (
		<>
			<div
				className="flex h-[480px] flex-col rounded-b-3xl bg-muted bg-cover bg-center"
				style={{
					backgroundImage: `url(https://image.tmdb.org/t/p/w780${movie.backdrop_path})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
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
								<MovieRating size="lg" vote_average={movie.vote_average} />
								<div>
									<p className="text-h6">
										{formatVoteCount(movie.vote_count)} Votes
									</p>
									<p className="text-body-xs opacity-80">
										Our Users Are Recommending This Movie
									</p>
								</div>
							</div>
							<Button
								size="xl"
								variant="outline"
								className="rounded-full border-none bg-transparent px-12 py-8 text-xl ring-2 ring-primary ring-offset-0"
								onClick={() => setIsTrailerDialogOpen(true)}
							>
								<Icon name="play" className="mr-6" />
								Watch Trailer
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className="container flex gap-10 py-16 lg:pl-24">
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
									className="rounded-full px-12 py-8 text-xl"
									onClick={() => setIsWatchProvidersDialogOpen(true)}
								>
									<Icon name="tv" className="mr-6" />
									Watch
								</Button>
								<Button
									size="xl"
									variant="outline"
									className={`rounded-full px-6 py-8 text-xl outline-none ring-0 focus-within:ring-0 focus-visible:ring-0 ${
										liked ? 'border-red-500 text-red-500' : ''
									}`}
									onClick={() => handleLike(movie.id)}
								>
									<Icon name={liked ? 'heart-filled' : 'heart'} />
								</Button>
								<Button
									size="xl"
									variant="outline"
									className="rounded-full px-6 py-8 text-xl"
									onClick={handleShare}
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
						<div className="w-32 space-y-2 uppercase">
							<p className="text-h4 font-thin">
								{getReleaseYear(movie.release_date)}
							</p>
							<p className="text-h4 font-thin">
								{formatRuntime(movie.runtime)}
							</p>
							<p className="text-h4 font-thin">PG13</p>
						</div>
						<div className="flex-1">
							<Tabs
								defaultValue="story"
								value={activeTab}
								onValueChange={setActiveTab}
							>
								<TabsList>
									<TabsTrigger value="story">Storyline</TabsTrigger>
									<TabsTrigger value="alternate">Alternate Endings</TabsTrigger>
									<TabsTrigger value="new">New</TabsTrigger>
								</TabsList>
								<TabsContent value="story">{movie.overview}</TabsContent>
								<TabsContent value="alternate">
									{alternateEndings.length > 0 ? (
										<div className="flex flex-col gap-4">
											<Accordion type="single" collapsible>
												{alternateEndings.map((ending) => (
													<AccordionItem key={ending.id} value={ending.id}>
														<AccordionTrigger>
															<>
																{ending.title}
																<i>by {ending.author.username}</i>
															</>
														</AccordionTrigger>
														<AccordionContent>
															{ending.content}
														</AccordionContent>
													</AccordionItem>
												))}
											</Accordion>
										</div>
									) : (
										<div className="flex flex-col items-center justify-center py-8">
											<p className="text-center text-muted-foreground">
												No alternate endings have been created yet.
											</p>
											<p className="text-center text-muted-foreground">
												Be the first to write one!
											</p>
											<Button
												onClick={() => setActiveTab('new')}
												variant="secondary"
												className="mt-8"
											>
												Create Alternate Ending
											</Button>
										</div>
									)}
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
								<ScrollArea className="h-64">
									{movie.credits?.cast.map((cast) => (
										<Link
											to={`/people/${cast.id}`}
											key={cast.id}
											className="flex items-center gap-4 [&:not(:first-of-type)]:mt-4"
										>
											<img
												className="aspect-square h-16 w-16 rounded-full object-cover"
												src={`https://image.tmdb.org/t/p/w92${cast.profile_path}`}
												alt={cast.name}
											></img>
											<div>
												<p>{cast.name}</p>
												<p className="text-body-xs opacity-60">
													{cast.character}
												</p>
											</div>
										</Link>
									))}
								</ScrollArea>
							</div>
						</div>
					</div>
				</div>

				<MovieRecommendations recommendations={movie.recommendations.results} />
			</div>
			{trailerKey && (
				<MovieTrailerDialog
					isOpen={isTrailerDialogOpen}
					onClose={() => setIsTrailerDialogOpen(false)}
					movieTitle={movie.title}
					trailerKey={trailerKey}
				/>
			)}
			<WatchProvidersDialog
				isOpen={isWatchProvidersDialogOpen}
				onClose={() => setIsWatchProvidersDialogOpen(false)}
				movieTitle={movie.title}
				watchProviders={movie['watch/providers']}
				country="NL"
			/>
		</>
	)
}

function MovieRecommendations({
	recommendations,
}: {
	recommendations: MovieListItem[]
}) {
	return (
		<div className="w-[27%] border-l-2 border-muted-foreground px-4">
			<h2 className="mb-10 text-h6">More like this</h2>
			<ScrollArea className="h-[500px] px-8">
				{recommendations.map((recommendation) => (
					<Link
						to={`/movies/${recommendation.id}`}
						className="flex items-center gap-6 [&:not(:first-of-type)]:mt-8"
						key={recommendation.id}
					>
						<img
							className="object-cover"
							src={`https://image.tmdb.org/t/p/w92${recommendation.poster_path}`}
							alt={recommendation.title}
						></img>
						<div className="flex flex-col gap-5">
							<p>{recommendation.title}</p>
							<div className="flex items-center gap-3">
								<MovieRating
									size="sm"
									vote_average={recommendation.vote_average}
								/>
								<div>
									<p className="text-h6">
										{getReleaseYear(recommendation.release_date)}
									</p>
									<p className="text-h6">
										{formatVoteCount(recommendation.vote_count)}
									</p>
								</div>
							</div>
						</div>
					</Link>
				))}
			</ScrollArea>
		</div>
	)
}

function MovieRating({
	vote_average,
	size = 'md',
}: {
	vote_average: number
	size: 'sm' | 'md' | 'lg'
}) {
	return (
		<div
			className={`relative h-${size === 'sm' ? '12' : size === 'md' ? '16' : '20'} w-${size === 'sm' ? '12' : size === 'md' ? '16' : '20'}`}
		>
			<svg className="h-full w-full" viewBox="0 0 36 36">
				<path
					d="M18 2.0845
										a 15.9155 15.9155 0 0 1 0 31.831
										a 15.9155 15.9155 0 0 1 0 -31.831"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeDasharray={`${vote_average * 10}, 100`}
					className="stroke-primary"
				/>
			</svg>
			<div
				className={cn(
					'absolute inset-0 flex items-center justify-center font-bold',
					size === 'sm' ? 'text-h6' : size === 'md' ? 'text-h5' : 'text-h4',
				)}
			>
				{vote_average.toFixed(1)}
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
