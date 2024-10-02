import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { cn } from '#app/utils/misc.tsx'
import { getTopRatedMovies, type Movie } from '#app/utils/tmdb.server.ts'

export const meta: MetaFunction = () => [{ title: 'Epic Notes' }]

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const page = url.searchParams.get('page') || '1'
	const pageNumber = parseInt(page, 10)
	const { results, total_pages } = await getTopRatedMovies(pageNumber)
	return json({ movies: { results, total_pages }, currentPage: pageNumber })
}

export default function Index() {
	const { movies, currentPage } = useLoaderData<typeof loader>()
	return (
		<main className="font-poppins container mb-20 flex flex-col items-center justify-center gap-6">
			<h1 className="text-h1">Top Rated Movies</h1>
			<div className="mt-8 flex justify-center gap-4">
				<Form>
					<Button
						type="submit"
						name="page"
						value={currentPage - 1}
						disabled={currentPage <= 1}
					>
						Previous
					</Button>
				</Form>
				<span className="flex items-center">
					Page {currentPage} of {movies.total_pages}
				</span>
				<Form>
					<Button
						type="submit"
						name="page"
						value={currentPage + 1}
						disabled={currentPage >= movies.total_pages}
					>
						Next
					</Button>
				</Form>
			</div>
			{movies.results.length ? (
				<>
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
					<div className="mt-8 flex justify-center gap-4">
						<Form>
							<Button
								type="submit"
								name="page"
								value={currentPage - 1}
								disabled={currentPage <= 1}
							>
								Previous
							</Button>
						</Form>
						<span className="flex items-center">
							Page {currentPage} of {movies.total_pages}
						</span>
						<Form>
							<Button
								type="submit"
								name="page"
								value={currentPage + 1}
								disabled={currentPage >= movies.total_pages}
							>
								Next
							</Button>
						</Form>
					</div>
				</>
			) : null}
		</main>
	)
}
