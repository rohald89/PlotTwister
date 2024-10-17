import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	useLoaderData,
	useFetcher,
	Form,
	useSearchParams,
	useSubmit,
} from '@remix-run/react'
import { useState, useEffect } from 'react'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import {
	getMovieDetails,
	searchMovies,
	type MovieSearchResult,
} from '#app/utils/tmdb.server.ts'
import { cn } from '#app/utils/misc.js'

export async function loader({ params, request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const contestId = params.contestId
	const contest = await prisma.contest.findUnique({
		where: { id: contestId },
		include: { movies: true },
	})
	if (!contest) {
		throw new Response('Not Found', { status: 404 })
	}

	const url = new URL(request.url)
	const searchTerm = url.searchParams.get('q')
	let searchResults: MovieSearchResult[] = []
	if (searchTerm) {
		const response = await searchMovies(searchTerm)
		searchResults = response.results
	}

	return json({ contest, searchResults })
}

export async function action({ params, request }: ActionFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const contestId = params.contestId
	const formData = await request.formData()
	const movieId = Number(formData.get('movieId'))
	const action = formData.get('action')

	if (action === 'add') {
		const movieDetails = await getMovieDetails(movieId)
		await prisma.contestMovie.create({
			data: {
				contest: { connect: { id: contestId } },
				tmdbMovieId: movieId,
				title: movieDetails.title,
				posterPath: movieDetails.poster_path
					? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
					: '',
			},
		})
	} else if (action === 'remove') {
		await prisma.contestMovie.deleteMany({
			where: {
				contestId,
				tmdbMovieId: movieId,
			},
		})
	}

	const updatedContest = await prisma.contest.findUnique({
		where: { id: contestId },
		include: { movies: true },
	})

	return json({ contestMovies: updatedContest?.movies || [] })
}

export default function ContestDetails() {
	const { contest, searchResults } = useLoaderData<typeof loader>()
	const fetcher = useFetcher<typeof loader>()
	const [searchParams] = useSearchParams()
	const submit = useSubmit()

	const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

	useEffect(() => {
		setSearchTerm(searchParams.get('q') || '')
	}, [searchParams])

	const handleMovieSearch = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		submit(event.currentTarget)
	}

	const handleAddMovie = (movieId: number) => {
		fetcher.submit(
			{ movieId: String(movieId), action: 'add' },
			{ method: 'post' },
		)
	}

	const handleRemoveMovie = (movieId: number) => {
		fetcher.submit(
			{ movieId: String(movieId), action: 'remove' },
			{ method: 'post' },
		)
	}

	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-4 text-2xl font-bold">{contest.title}</h1>
			<p>{contest.description}</p>
			<p>Theme: {contest.theme}</p>
			<p>Start Date: {new Date(contest.startDate).toLocaleDateString()}</p>
			<p>End Date: {new Date(contest.endDate).toLocaleDateString()}</p>
			<p>
				Voting End Date: {new Date(contest.votingEndDate).toLocaleDateString()}
			</p>

			<h2 className="mb-4 mt-8 text-xl font-bold">Contest Movies</h2>
			<ul className="flex flex-wrap gap-4">
				{contest.movies.map((movie) => (
					<li key={movie.tmdbMovieId} className="w-40">
						<div
							className="flex h-full flex-col items-center justify-between rounded-lg bg-muted p-3 ring-2 ring-primary"
							onClick={() => handleRemoveMovie(movie.tmdbMovieId)}
						>
							<img
								src={movie.posterPath}
								alt={movie.title}
								className="w-full object-cover"
							/>
							<h2 className="text-small mt-2 line-clamp-2 text-center font-bold">
								{movie.title}
							</h2>
						</div>
					</li>
				))}
			</ul>

			<h2 className="mb-4 mt-8 text-xl font-bold">Add Movies</h2>
			<Form onSubmit={handleMovieSearch} className="mb-4 flex gap-4">
				<Input
					type="text"
					name="q"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search for movies"
				/>
				<Button type="submit">Search</Button>
			</Form>
			<ul className="flex flex-wrap gap-4">
				{searchResults.map((movie) => (
					<li key={movie.id} className="w-40">
						<div
							className={cn(
								'flex h-full cursor-pointer flex-col items-center justify-between rounded-lg bg-muted p-3',
								contest.movies.some((m) => m.tmdbMovieId === movie.id) &&
									'ring-2 ring-primary',
							)}
							onClick={() => handleAddMovie(movie.id)}
						>
							<img
								src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
								alt={movie.title}
								className="w-full object-cover"
							/>
							<h2 className="text-small mt-2 line-clamp-2 text-center font-bold">
								{movie.title}
							</h2>
						</div>
					</li>
				))}
			</ul>
		</div>
	)
}
