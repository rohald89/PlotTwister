import React from 'react'
import { type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import {
	defer,
	Await,
	Link,
	useLoaderData,
	useSearchParams,
	useSubmit,
	Form,
} from '@remix-run/react'
import { Suspense } from 'react'
import { Button } from '#app/components/ui/button'
import { cn } from '#app/utils/misc.tsx'
import {
	searchMovies,
	getPopularMovies,
	type Movie,
} from '#app/utils/tmdb.server.ts'
import { useId } from 'react'
import { useDebounce, useIsPending } from '#app/utils/misc.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export const meta: MetaFunction = () => [{ title: 'Movies' }]

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const pageParam = url.searchParams.get('page') || '1'
	const searchQuery = url.searchParams.get('q')
	const pageNumber = Math.max(1, parseInt(pageParam, 10) || 1)

	const moviesPromise = searchQuery
		? searchMovies(searchQuery, pageNumber)
		: getPopularMovies(pageNumber)

	const movies = moviesPromise.then(async (result) => {
		// Simulate delay for demonstration purposesP
		// await new Promise((resolve) => setTimeout(resolve, 1000))
		return result
	})

	return defer({ movies, currentPage: pageNumber, searchQuery })
}

export default function Movies() {
	const { movies, currentPage, searchQuery } = useLoaderData<typeof loader>()
	const [searchParams] = useSearchParams()

	return (
		<main className="font-poppins container mb-20 flex flex-col items-center justify-center gap-6">
			<h1 className="text-h1">
				{searchQuery ? 'Search Results' : 'Popular Movies'}
			</h1>

			<MovieSearch />

			<Suspense fallback={<div />}>
				<Await resolve={movies}>
					{(movies) => (
						<>
							<Pagination
								currentPage={currentPage}
								totalPages={movies.total_pages}
							/>
							<ul
								className={cn(
									'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
								)}
							>
								{(movies.results as Movie[]).map((movie) => (
									<li key={movie.id} className="w-full">
										<Link
											to={`/movies/${movie.id}`}
											className="flex h-full flex-col items-center justify-between rounded-lg bg-muted p-3"
										>
											<img
												src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
												alt={movie.title}
												className="w-full object-cover"
											/>
											<h2 className="text-small mt-2 line-clamp-2 text-center font-bold">
												{movie.title}
											</h2>
										</Link>
									</li>
								))}
							</ul>
							<Pagination
								currentPage={currentPage}
								totalPages={movies.total_pages}
							/>
						</>
					)}
				</Await>
			</Suspense>
		</main>
	)
}

function Pagination({
	currentPage,
	totalPages,
}: {
	currentPage: number
	totalPages: number
}) {
	const [searchParams] = useSearchParams()

	const createPageLink = (page: number) => {
		const newSearchParams = new URLSearchParams(searchParams)
		newSearchParams.set('page', page.toString())
		return `?${newSearchParams.toString()}`
	}

	return (
		<div className="flex justify-center gap-4">
			{currentPage > 1 ? (
				<Button asChild>
					<Link to={createPageLink(currentPage - 1)}>Previous</Link>
				</Button>
			) : (
				<Button disabled>Previous</Button>
			)}
			<span className="flex items-center">
				Page {currentPage} of {totalPages}
			</span>
			{currentPage < totalPages ? (
				<Button asChild>
					<Link to={createPageLink(currentPage + 1)}>Next</Link>
				</Button>
			) : (
				<Button disabled>Next</Button>
			)}
		</div>
	)
}

function MovieSearch() {
	const id = useId()
	const [searchParams] = useSearchParams()
	const submit = useSubmit()
	const isSubmitting = useIsPending({
		formMethod: 'GET',
		formAction: '/movies',
	})

	const handleFormChange = useDebounce((form: HTMLFormElement) => {
		submit(form)
	}, 400)

	return (
		<Form
			method="GET"
			action="/movies"
			className="w-full max-w-sm"
			onChange={(e) => handleFormChange(e.currentTarget)}
		>
			<div className="flex items-center gap-2">
				<Input
					type="search"
					name="q"
					id={id}
					defaultValue={searchParams.get('q') ?? ''}
					placeholder="Search movies..."
					className="w-full"
				/>
				<StatusButton
					type="submit"
					status={isSubmitting ? 'pending' : 'idle'}
					className="flex items-center justify-center"
				>
					<Icon name="magnifying-glass" size="sm" />
					<span className="sr-only">Search</span>
				</StatusButton>
			</div>
		</Form>
	)
}
