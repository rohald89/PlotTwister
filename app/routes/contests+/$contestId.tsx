import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, Link } from '@remix-run/react'
import React from 'react'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { Button } from '#app/components/ui/button.tsx'
import { VoteButtons } from '#app/routes/movies+/__vote-buttons.tsx'
import { format } from 'date-fns'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const contestId = params.contestId

	const contest = await prisma.contest.findUnique({
		where: { id: contestId },
		include: {
			movies: true,
			entries: {
				include: {
					alternateEnding: {
						include: {
							author: { select: { username: true } },
							votes: {
								where: { userId },
								select: { value: true },
							},
						},
					},
				},
			},
		},
	})

	if (!contest) {
		throw new Response('Contest not found', { status: 404 })
	}

	return json({ contest, userId })
}

export default function ContestDetailsPage() {
	const { contest, userId } = useLoaderData<typeof loader>()

	// Group entries by movie
	type MovieEntry = {
		movie: (typeof contest.movies)[number]
		entries: typeof contest.entries
	}

	const entriesByMovie: Record<string, MovieEntry> = contest.movies.reduce(
		(acc, movie) => {
			acc[movie.tmdbMovieId] = {
				movie,
				entries: contest.entries.filter(
					(entry) => entry.alternateEnding.tmdbMovieId === movie.tmdbMovieId,
				),
			}
			return acc
		},
		{} as Record<string, MovieEntry>,
	)

	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-4 text-3xl font-bold">{contest.title}</h1>
			<p className="mb-2">{contest.description}</p>
			<p className="mb-8">
				Ends on: {format(new Date(contest.endDate), 'PPP')}
			</p>

			{Object.values(entriesByMovie).map(({ movie, entries }: MovieEntry) => (
				<div key={movie.tmdbMovieId} className="mb-12 flex">
					<div className="w-1/4 pr-4">
						<img
							src={movie.posterPath}
							alt={movie.title}
							className="w-full rounded-lg"
						/>
						<h2 className="mt-2 text-xl font-semibold">{movie.title}</h2>
					</div>
					<div className="w-3/4">
						{entries.length === 0 ? (
							<div className="flex h-full flex-col items-center justify-center">
								<p className="mb-4">No alternate endings yet for this movie.</p>
								<Link
									to={`/contests/${contest.id}/submit/${movie.tmdbMovieId}`}
								>
									<Button variant="default">Be the first to submit!</Button>
								</Link>
							</div>
						) : (
							<ul className="space-y-8">
								{entries.map((entry) => (
									<li key={entry.id} className="rounded-lg border p-4">
										<h3 className="mb-2 text-xl font-semibold">
											{entry.alternateEnding.title}
										</h3>
										<p className="mb-2">
											By: {entry.alternateEnding.author.username}
										</p>
										<p className="mb-4 whitespace-pre-wrap">
											{entry.alternateEnding.content}
										</p>
										<VoteButtons
											alternateEnding={entry.alternateEnding}
											userVote={entry.alternateEnding.votes[0]?.value || 0}
										/>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			))}
		</div>
	)
}
