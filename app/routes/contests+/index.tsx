import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.ts'
import { Button } from '#app/components/ui/button'
import { format } from 'date-fns'

export async function loader({ request }: LoaderFunctionArgs) {
	const activeContests = await prisma.contest.findMany({
		where: { status: 'ACTIVE' },
		include: {
			movies: true,
		},
		orderBy: { endDate: 'asc' },
	})

	return json({ activeContests })
}

export default function ContestsPage() {
	const { activeContests } = useLoaderData<typeof loader>()

	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-8 text-3xl font-bold">Active Contests</h1>
			{activeContests.length === 0 ? (
				<p>There are no active contests at the moment.</p>
			) : (
				activeContests.map((contest) => (
					<div key={contest.id} className="mb-12">
						<h2 className="mb-4 text-2xl font-semibold">{contest.title}</h2>
						<p className="mb-2">{contest.description}</p>
						<p className="mb-4">
							Ends on: {format(new Date(contest.endDate), 'PPP')}
						</p>
						<h3 className="mb-2 text-xl font-semibold">Contest Movies</h3>
						<ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
							{contest.movies.map((movie) => (
								<li key={movie.tmdbMovieId} className="w-full">
									<div className="flex h-full flex-col items-center justify-between rounded-lg bg-muted p-3">
										<Link
											to={`/movies/${movie.tmdbMovieId}`}
											className="w-full"
										>
											<img
												src={movie.posterPath}
												alt={movie.title}
												className="w-full object-cover"
											/>
											<h4 className="mt-2 line-clamp-2 text-center font-bold">
												{movie.title}
											</h4>
										</Link>
										<Link
											to={`/contests/${contest.id}/submit/${movie.tmdbMovieId}`}
											className="mt-2 w-full"
										>
											<Button variant="secondary" size="sm" className="w-full">
												Submit Ending
											</Button>
										</Link>
									</div>
								</li>
							))}
						</ul>
					</div>
				))
			)}
		</div>
	)
}
