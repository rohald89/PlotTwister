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
		<div className="min-h-screen bg-background text-foreground">
			{/* Hero Section */}
			<section
				className="relative h-96 bg-cover bg-center"
				style={{ backgroundImage: `url('/images/hero-background.jpg')` }}
			>
				<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
					<div className="text-center text-white">
						<h1 className="mb-4 text-5xl font-bold">PlotTwister Contests</h1>
						<p className="mb-8 text-2xl">
							Where Your Imagination Rewrites Hollywood!
						</p>
						<Button size="lg" asChild>
							<Link to="#active-contests">Join a Challenge</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* About Section */}
			<section className="mx-auto mt-8 max-w-4xl rounded-lg bg-card p-6 shadow-lg">
				<p className="mb-8 text-lg text-muted-foreground">
					Welcome to the ultimate cinematic playground where YOU become the
					master of alternate realities! Ever watched a movie and thought, "I
					could've ended that better"? Well, now's your chance to prove it!
				</p>
				<h2 className="mb-6 text-3xl font-bold text-primary">
					Why Join Our Challenges?
				</h2>
				<ol className="mb-8 list-inside list-decimal space-y-4">
					<li className="text-lg">
						<span className="font-bold">Unleash Your Creativity:</span> Break
						free from Hollywood's constraints and let your imagination run wild!
					</li>
					<li className="text-lg">
						<span className="font-bold">Gain Fame in Our Community:</span> Your
						twist could be the next big thing everyone's talking about!
					</li>
					<li className="text-lg">
						<span className="font-bold">Win Awesome Prizes:</span> From bragging
						rights to actual rewards, victory has never been sweeter!
					</li>
				</ol>
				<h2 className="mb-6 text-3xl font-bold text-primary">How It Works:</h2>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					<div>
						<h3 className="mb-2 text-xl font-semibold">🎬 Pick a Challenge</h3>
						<p className="text-muted-foreground">
							Choose from our themed contests that put a unique spin on classic
							films.
						</p>
					</div>
					<div>
						<h3 className="mb-2 text-xl font-semibold">✍️ Craft Your Ending</h3>
						<p className="text-muted-foreground">
							Write a mind-blowing alternate ending that'll make people say,
							"Why didn't they think of that?"
						</p>
					</div>
					<div>
						<h3 className="mb-2 text-xl font-semibold">🏆 Compete and Win</h3>
						<p className="text-muted-foreground">
							Submit your masterpiece and let the PlotTwister community go wild!
						</p>
					</div>
				</div>
			</section>

			{/* Active Contests Section */}
			<section
				id="active-contests"
				className="mx-auto mt-8 max-w-4xl rounded-lg bg-card p-6 shadow-lg"
			>
				<h2 className="mb-8 text-3xl font-bold text-primary">
					Current Challenges
				</h2>
				{activeContests.length === 0 ? (
					<p className="text-center text-xl text-muted-foreground">
						There are no active challenges at the moment. Check back soon!
					</p>
				) : (
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{activeContests.map((contest) => (
							<div
								key={contest.id}
								className="overflow-hidden rounded-lg bg-card shadow-md transition-shadow hover:shadow-lg"
							>
								<div className="p-6">
									<h3 className="mb-2 text-2xl font-semibold text-primary">
										{contest.title}
									</h3>
									<p className="mb-4 text-muted-foreground">
										{contest.description}
									</p>
									<p className="mb-2 text-sm text-muted-foreground">
										Ends on: {format(new Date(contest.endDate), 'PPP')}
									</p>
									<h4 className="mb-2 text-lg font-semibold text-primary">
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
											<div className="flex h-24 w-16 items-center justify-center rounded bg-muted">
												<span className="text-sm text-muted-foreground">
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
			</section>

			{/* Call to Action */}
			<section className="mx-auto my-8 max-w-4xl rounded-lg bg-primary p-6 text-center text-primary-foreground shadow-lg">
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
				<Button
					size="lg"
					asChild
					className="bg-background text-foreground hover:bg-background/90"
				>
					<Link to="#active-contests">Join a Challenge</Link>
				</Button>
			</section>
		</div>
	)
}
