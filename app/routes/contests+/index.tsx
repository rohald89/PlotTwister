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
		<div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
			{/* Hero Section */}
			<section className="relative px-4 py-20 sm:px-6 lg:px-8">
				<div className="absolute inset-0 overflow-hidden">
					<img
						src="/images/hero-background.jpg"
						alt="Movie collage"
						className="h-full w-full object-cover object-center"
					/>
					<div className="absolute inset-0 bg-black opacity-60"></div>
				</div>
				<div className="relative mx-auto max-w-7xl text-center">
					<h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
						PlotTwister Contests
					</h1>
					<p className="mb-8 text-xl sm:text-2xl md:text-3xl">
						Where Your Imagination Rewrites Hollywood!
					</p>
					<Button size="lg" asChild>
						<Link to="#active-contests">Join a Challenge</Link>
					</Button>
				</div>
			</section>

			{/* About Section */}
			<section className="bg-gray-800 px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-3xl">
					<p className="mb-8 text-center text-lg">
						Welcome to the ultimate cinematic playground where YOU become the
						master of alternate realities! Ever watched a movie and thought, "I
						could've ended that better"? Well, now's your chance to prove it!
					</p>
					<h2 className="mb-6 text-center text-3xl font-bold">
						Why Join Our Challenges?
					</h2>
					<ol className="mb-8 list-inside list-decimal space-y-4">
						<li className="text-lg">
							<span className="font-bold">Unleash Your Creativity:</span> Break
							free from Hollywood's constraints and let your imagination run
							wild!
						</li>
						<li className="text-lg">
							<span className="font-bold">Gain Fame in Our Community:</span>{' '}
							Your twist could be the next big thing everyone's talking about!
						</li>
						<li className="text-lg">
							<span className="font-bold">Win Awesome Prizes:</span> From
							bragging rights to actual rewards, victory has never been sweeter!
						</li>
					</ol>
					<h2 className="mb-6 text-center text-3xl font-bold">How It Works:</h2>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						<div>
							<h3 className="mb-2 text-xl font-semibold">
								🎬 Pick a Challenge
							</h3>
							<p>
								Choose from our themed contests that put a unique spin on
								classic films.
							</p>
						</div>
						<div>
							<h3 className="mb-2 text-xl font-semibold">
								✍️ Craft Your Ending
							</h3>
							<p>
								Write a mind-blowing alternate ending that'll make people say,
								"Why didn't they think of that?"
							</p>
						</div>
						<div>
							<h3 className="mb-2 text-xl font-semibold">🏆 Compete and Win</h3>
							<p>
								Submit your masterpiece and let the PlotTwister community go
								wild!
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Active Contests Section */}
			<section id="active-contests" className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<h2 className="mb-8 text-center text-3xl font-bold">
						Current Challenges
					</h2>
					{activeContests.length === 0 ? (
						<p className="text-center text-xl">
							There are no active challenges at the moment. Check back soon!
						</p>
					) : (
						<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
							{activeContests.map((contest) => (
								<div
									key={contest.id}
									className="overflow-hidden rounded-lg bg-gray-700 shadow-lg transition-transform hover:scale-105"
								>
									<div className="p-6">
										<h3 className="mb-2 text-2xl font-semibold">
											{contest.title}
										</h3>
										<p className="mb-4">{contest.description}</p>
										<p className="mb-2">
											Ends on: {format(new Date(contest.endDate), 'PPP')}
										</p>
										<h4 className="mb-2 text-xl font-semibold">
											Featured Movies
										</h4>
										<div className="mb-4 flex flex-wrap gap-2">
											{contest.movies.slice(0, 3).map((movie) => (
												<img
													key={movie.tmdbMovieId}
													src={movie.posterPath}
													alt={movie.title}
													className="h-24 w-16 rounded object-cover"
												/>
											))}
											{contest.movies.length > 3 && (
												<div className="flex h-24 w-16 items-center justify-center rounded bg-gray-600">
													<span className="text-sm">
														+{contest.movies.length - 3} more
													</span>
												</div>
											)}
										</div>
										<Button asChild className="w-full">
											<Link to={`/contests/${contest.id}`}>Join Challenge</Link>
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</section>

			{/* Call to Action */}
			<section className="bg-gray-900 px-4 py-16 text-center sm:px-6 lg:px-8">
				<p className="mb-8 text-xl">
					Don't just watch movies - reinvent them! Join a challenge today and
					show the world what happens when sidekicks take center stage, villains
					get their happy endings, or when movies collide in spectacular
					fashion!
				</p>
				<h2 className="mb-4 text-3xl font-bold">Ready to twist some plots?</h2>
				<p className="mb-8 text-xl">
					Dive into a challenge now and rewrite cinema history!
				</p>
				<Button size="lg" asChild>
					<Link to="#active-contests">Join a Challenge</Link>
				</Button>
			</section>
		</div>
	)
}
