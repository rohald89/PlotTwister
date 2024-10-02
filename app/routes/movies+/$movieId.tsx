import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, Link, useLoaderData, type MetaFunction } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'

export async function loader({ params }: LoaderFunctionArgs) {
	const movie = await fetch(
		`https://api.themoviedb.org/3/movie/${params.movieId}?api_key=${process.env.TMDB_API_KEY}`,
	).then((res) => res.json())

	invariantResponse(movie, 'Movie not found', { status: 404 })

	return json({ movie })
}

export default function ProfileRoute() {
	const data = useLoaderData<typeof loader>()
	const movie = data.movie

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat">
			<Spacer size="4xs" />

			<div
				className="cover container flex min-h-96 flex-col rounded-3xl bg-muted bg-cover"
				style={{
					backgroundImage: `linear-gradient(rgba(2,8,23, 0.9), rgba(0, 0, 0, 0.7)), url(https://image.tmdb.org/t/p/w780${movie.backdrop_path})`,
				}}
			>
				<div className="relative">
					<div className="absolute -top-40 left-10">
						<div className="relative flex items-center gap-6">
							<img
								src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
							></img>
							<h1 className="text-h2">{movie.title}</h1>
						</div>
					</div>
				</div>

				<Spacer size="xl" />

				<div className="flex flex-col items-center">
					<div className="flex flex-wrap items-center justify-center gap-4"></div>
					{/* <p className="mt-2 text-center text-muted-foreground">
						Joined {data.userJoinedDisplay}
					</p>
					{isLoggedInUser ? (
						<Form action="/logout" method="POST" className="mt-3">
							<Button type="submit" variant="link" size="pill">
								<Icon name="exit" className="scale-125 max-md:scale-150">
									Logout
								</Icon>
							</Button>
						</Form>
					) : null}
					<div className="mt-10 flex gap-4">
						{isLoggedInUser ? (
							<>
								<Button asChild>
									<Link to="notes" prefetch="intent">
										My notes
									</Link>
								</Button>
								<Button asChild>
									<Link to="/settings/profile" prefetch="intent">
										Edit profile
									</Link>
								</Button>
							</>
						) : (
							<Button asChild>
								<Link to="notes" prefetch="intent">
									{userDisplayName}'s notes
								</Link>
							</Button>
						)}
					</div> */}
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const movie = data.movie
	return [
		{ title: `${movie.title} | PlotTwisters` },
		{
			name: 'description',
			content: `Movie details for ${movie.title} on PlotTwisters`,
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
