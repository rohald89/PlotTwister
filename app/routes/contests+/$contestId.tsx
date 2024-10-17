import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, Link } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.ts'
import { Button } from '#app/components/ui/button.tsx'
import defaultImage from './assets/images/default-background.avif'
import {
	format,
	differenceInDays,
	differenceInHours,
	differenceInMinutes,
} from 'date-fns'
import { useState, useEffect } from 'react'

export async function loader({ params }: LoaderFunctionArgs) {
	const contestId = params.contestId
	const contest = await prisma.contest.findUnique({
		where: { id: contestId },
		include: { movies: true },
	})

	if (!contest) {
		throw new Response('Contest not found', { status: 404 })
	}

	return json({ contest })
}

function CountdownTimer({ endDate }: { endDate: Date }) {
	const [timeLeft, setTimeLeft] = useState('')

	useEffect(() => {
		function updateTimer() {
			const now = new Date()
			const end = new Date(endDate)
			const diff = end.getTime() - now.getTime()

			if (diff <= 0) {
				setTimeLeft('Contest has ended')
				return
			}

			const days = Math.floor(diff / (1000 * 60 * 60 * 24))
			const hours = Math.floor(
				(diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
			)
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
			const seconds = Math.floor((diff % (1000 * 60)) / 1000)

			setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
		}

		updateTimer() // Run immediately
		const timer = setInterval(updateTimer, 1000) // Update every second

		return () => clearInterval(timer)
	}, [endDate])

	return <span className="font-bold">{timeLeft}</span>
}

export default function ContestDetailsPage() {
	const { contest } = useLoaderData<typeof loader>()

	return (
		<div className="min-h-screen bg-background text-foreground">
			{/* Hero Section */}
			<section
				className="relative h-96 bg-cover bg-center"
				style={{
					backgroundImage: `url(${contest.backgroundImage || '/img/default-background.avif'})`,
				}}
			>
				<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
					<div className="text-center text-white">
						<h1 className="mb-4 text-5xl font-bold">{contest.title}</h1>
						<p className="text-2xl">{contest.tagline}</p>
					</div>
				</div>
			</section>

			{/* Challenge Details */}
			<section className="mx-auto mt-8 max-w-4xl rounded-lg bg-card p-6 shadow-lg">
				<h2 className="mb-4 text-3xl font-bold text-primary">
					Challenge Details
				</h2>
				<p className="mb-4 text-muted-foreground">{contest.description}</p>
				<p className="mb-4 text-muted-foreground">
					<strong className="text-foreground">Theme:</strong> {contest.theme}
				</p>
				<div className="mb-4 grid grid-cols-3 gap-4">
					<div>
						<strong className="text-foreground">Start Date:</strong>
						<p className="text-muted-foreground">
							{format(new Date(contest.startDate), 'PPP')}
						</p>
					</div>
					<div>
						<strong className="text-foreground">Submission Deadline:</strong>
						<p className="text-muted-foreground">
							{format(new Date(contest.endDate), 'PPP')}
						</p>
					</div>
					<div>
						<strong className="text-foreground">Voting Ends:</strong>
						<p className="text-muted-foreground">
							{format(new Date(contest.votingEndDate), 'PPP')}
						</p>
					</div>
				</div>
				<div className="rounded-lg bg-primary/10 p-4">
					<strong className="text-foreground">Time Left to Submit:</strong>{' '}
					<CountdownTimer endDate={new Date(contest.endDate)} />
				</div>
			</section>

			{/* How to Participate */}
			<section className="mx-auto mt-8 max-w-4xl rounded-lg bg-card p-6 shadow-lg">
				<h2 className="mb-4 text-3xl font-bold text-primary">
					How to Participate
				</h2>
				<ol className="list-inside list-decimal space-y-2 text-muted-foreground">
					<li>Choose a movie from the list below</li>
					<li>Write your alternate ending (max 500 words)</li>
					<li>Submit your entry before the deadline</li>
					<li>Vote for your favorite entries once voting begins</li>
				</ol>
				<p className="mt-4 text-muted-foreground">
					<strong className="text-foreground">Note:</strong> Be creative, but
					keep it family-friendly!
				</p>
			</section>

			{/* Prizes and Rewards */}
			<section className="mx-auto mt-8 max-w-4xl rounded-lg bg-card p-6 shadow-lg">
				<h2 className="mb-4 text-3xl font-bold text-primary">
					Prizes and Rewards
				</h2>
				<ul className="list-inside list-disc space-y-2 text-muted-foreground">
					<li>1st Place: $100 Amazon Gift Card + "Master PlotTwister" badge</li>
					<li>2nd Place: $50 Amazon Gift Card + "Elite PlotTwister" badge</li>
					<li>3rd Place: $25 Amazon Gift Card + "Skilled PlotTwister" badge</li>
					<li>Top 10: "PlotTwister Finalist" badge</li>
				</ul>
				<p className="mt-4 text-muted-foreground">
					<strong className="text-foreground">Winner Selection:</strong> Winners
					will be chosen by community vote. Make sure to share your entry and
					gather support!
				</p>
			</section>

			{/* Participating Movies */}
			<section className="mx-auto mt-8 max-w-4xl rounded-lg bg-card p-6 shadow-lg">
				<h2 className="mb-4 text-3xl font-bold text-primary">
					Participating Movies
				</h2>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
					{contest.movies.map((movie) => (
						<Link
							key={movie.id}
							to={`/contests/${contest.id}/submit/${movie.tmdbMovieId}`}
							className="text-center"
						>
							<img
								src={movie.posterPath}
								alt={movie.title}
								className="h-auto w-full rounded-lg shadow-md transition-shadow duration-300 hover:shadow-xl"
							/>
							<p className="mt-2 font-semibold text-foreground">
								{movie.title}
							</p>
						</Link>
					))}
				</div>
			</section>

			{/* FAQ or Tips */}
			<section className="mx-auto mt-8 max-w-4xl rounded-lg bg-card p-6 shadow-lg">
				<h2 className="mb-4 text-3xl font-bold text-primary">FAQ and Tips</h2>
				<div className="space-y-4">
					<div>
						<h3 className="text-xl font-semibold text-foreground">
							Q: How long should my alternate ending be?
						</h3>
						<p className="text-muted-foreground">
							A: Aim for 300-500 words. Quality over quantity!
						</p>
					</div>
					<div>
						<h3 className="text-xl font-semibold text-foreground">
							Q: Can I submit multiple entries?
						</h3>
						<p className="text-muted-foreground">
							A: Yes, you can submit one entry per movie in the challenge.
						</p>
					</div>
					<div>
						<h3 className="text-xl font-semibold text-foreground">
							Tip: Think Outside the Box
						</h3>
						<p className="text-muted-foreground">
							Don't be afraid to take risks with your ending. The most
							unexpected twists often win!
						</p>
					</div>
					<div>
						<h3 className="text-xl font-semibold text-foreground">
							Tip: Stay True to the Characters
						</h3>
						<p className="text-muted-foreground">
							While your ending should be surprising, make sure it still feels
							true to the characters' motivations.
						</p>
					</div>
				</div>
			</section>

			{/* Call-to-Action */}
			<section className="mx-auto my-8 max-w-4xl rounded-lg bg-primary p-6 text-center shadow-lg">
				<h2 className="mb-4 text-3xl font-bold text-primary-foreground">
					Ready to Rewrite Movie History?
				</h2>
				<Button
					size="lg"
					asChild
					className="bg-background text-foreground hover:bg-background/90"
				>
					<Link to={`/contests/${contest.id}/submit`}>Submit Your Ending</Link>
				</Button>
			</section>
		</div>
	)
}
