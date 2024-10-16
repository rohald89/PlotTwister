import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
	useLoaderData,
	useNavigate,
	type MetaFunction,
	useLocation,
	useFetcher,
	Link,
} from '@remix-run/react'
import { useState, useMemo } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { MovieTrailerDialog } from '#app/components/movietrailer-dialog'
import { useToast } from '#app/components/toaster'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '#app/components/ui/accordion'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { ScrollArea, ScrollBar } from '#app/components/ui/scroll-area.js'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs.js'
import { WatchProvidersDialog } from '#app/components/watch-provider-dialog'
import { getUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import {
	formatRuntime,
	formatVoteCount,
	getRecommendationString,
	getReleaseYear,
} from '#app/utils/misc.js'
import { getMovie, type MovieListItem } from '#app/utils/tmdb.server.ts'
import { type Toast } from '#app/utils/toast.server.js'
import { AlternateEndingEditor } from './__ending-editor'
import { MovieRating } from './__movie-rating'
import { VoteButtons } from './__vote-buttons'
export { action } from './__ending-editor.server'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await getUserId(request)
	const movie = await getMovie(params.movieId!)
	const alternateEndings = await prisma.alternateEnding.findMany({
		where: { tmdbMovieId: Number(params.movieId) },
		include: {
			author: { select: { username: true } },
			votes: userId
				? {
						where: { userId },
						select: { value: true },
					}
				: false,
		},
		orderBy: { score: 'desc' },
	})

	let isLiked = false
	if (userId) {
		const like = await prisma.movieLike.findUnique({
			where: {
				userId_tmdbMovieId: {
					userId,
					tmdbMovieId: Number(params.movieId),
				},
			},
		})
		isLiked = !!like
	}

	const trailer = movie.videos?.results.find(
		(video) => video.type === 'Trailer' && video.site === 'YouTube',
	)

	return json({
		movie,
		alternateEndings,
		isLiked,
		trailerKey: trailer?.key,
		isAuthenticated: !!userId,
	})
}

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

	const recommendationString = useMemo(
		() => getRecommendationString(movie.vote_average),
		[movie.vote_average],
	)

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
				className="relative flex h-[480px] flex-col rounded-b-3xl bg-muted bg-cover bg-center"
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
								<MovieRating vote_average={movie.vote_average} size="lg" />
								<div>
									<p className="text-h6">
										{formatVoteCount(movie.vote_count)} Votes
									</p>
									<p className="text-body-xm max-w-xs opacity-80 lg:max-w-md">
										{recommendationString}
									</p>
								</div>
							</div>
							<Button
								size="xl"
								variant="outline"
								className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-none bg-transparent px-12 py-8 text-xl ring-2 ring-primary ring-offset-0 lg:static lg:translate-x-0 lg:translate-y-0"
								onClick={() => setIsTrailerDialogOpen(true)}
							>
								<Icon name="play" className="mr-6" />
								Watch Trailer
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className="container flex flex-col gap-10 py-16 lg:pl-24 2xl:flex-row">
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

					<div className="flex flex-wrap gap-10">
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
									{alternateEndings.length ? (
										<AlternateEndings />
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
						<Cast />
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

function AlternateEndings() {
	const { alternateEndings } = useLoaderData<typeof loader>()
	return (
		<div className="flex flex-col gap-4">
			<Accordion type="single" collapsible>
				{alternateEndings.map((ending) => (
					<AccordionItem key={ending.id} value={ending.id}>
						<AccordionTrigger>
							<div className="flex w-full items-center justify-between">
								{ending.title}
							</div>
						</AccordionTrigger>
						<AccordionContent>
							<p>{ending.content}</p>
							<p className="mt-2 text-sm text-gray-500">
								by {ending.author.username}
							</p>
							<VoteButtons
								alternateEnding={ending}
								userVote={ending.votes?.[0]?.value ?? 0}
							/>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	)
}

function Cast() {
	const { movie } = useLoaderData<typeof loader>()
	return (
		<div className="w-full lg:w-1/4">
			<h2 className="mb-4 text-h6">Cast</h2>

			<ScrollArea className="w-full lg:h-96">
				<div className="flex w-max space-x-10 p-4 lg:flex-col lg:space-x-0 lg:space-y-6">
					{movie.credits.cast.map((member) => (
						<Link
							to={`/people/${member.id}`}
							key={member.id}
							className="flex max-w-60 items-center gap-4 [&:not(:first-of-type)]:mt-4"
						>
							<img
								className="aspect-square h-16 w-16 rounded-full object-cover"
								src={`https://image.tmdb.org/t/p/w92${member.profile_path}`}
								alt={member.name}
							></img>
							<div>
								<p>{member.name}</p>
								<p className="text-body-xs opacity-60">{member.character}</p>
							</div>
						</Link>
					))}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	)
}

function MovieRecommendations({
	recommendations,
}: {
	recommendations: MovieListItem[]
}) {
	return (
		<div className="container w-full pl-0 2xl:w-[27%] 2xl:border-l-2 2xl:border-muted-foreground 2xl:px-8">
			<h2 className="mb-10 text-h6">More like this</h2>
			<ScrollArea className="w-full 2xl:h-[600px]">
				<div className="flex w-max space-x-10 p-4 2xl:w-full 2xl:flex-col 2xl:space-x-0 2xl:space-y-8">
					{recommendations.map((recommendation) => (
						<Link
							to={`/movies/${recommendation.id}`}
							className="flex items-center gap-6"
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
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	)
}

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
