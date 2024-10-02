import { json, LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { cn } from '#app/utils/misc.tsx'
import { logos } from './logos/logos.ts'
import { Link, useLoaderData } from '@remix-run/react'
import { getTopRatedMovies } from '#app/utils/tmdb.server.ts'

interface Movie {
	id: number
	title: string
	poster_path: string
}

export const meta: MetaFunction = () => [{ title: 'Epic Notes' }]

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const page = url.searchParams.get('page') || '1'
	const pageNumber = parseInt(page, 10)
	const { results } = await getTopRatedMovies(pageNumber)
	return json({ movies: { results } })
}

export default function Index() {
	const data = useLoaderData<typeof loader>()
	console.log(data.movies.results)
	return (
		<main className="font-poppins container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
			<h1>PlotTwisters</h1>
			{data.movies.results.length ? (
				<ul
					className={cn(
						'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
					)}
				>
					{data.movies.results.map((movie: Movie) => (
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
								<h2 className="mt-2 line-clamp-2 text-center text-sm">
									{movie.title}
								</h2>
							</Link>
						</li>
					))}
				</ul>
			) : null}
		</main>
	)
}
