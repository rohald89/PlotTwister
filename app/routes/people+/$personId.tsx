import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, Link } from '@remix-run/react'
import { getPerson } from '#app/utils/tmdb.server'

export async function loader({ params }: LoaderFunctionArgs) {
	const personId = params.personId
	if (!personId) {
		throw new Response('Not Found', { status: 404 })
	}
	const person = await getPerson(personId)
	return json({ person })
}

export default function PeopleIndex() {
	const { person } = useLoaderData<typeof loader>()

	// Sort movies by popularity and take the first 10
	const topMovies = person.movie_credits.cast
		.sort((a, b) => b.popularity - a.popularity)
		.slice(0, 10)

	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-4 text-2xl font-bold">Person Details</h1>
			<div className="rounded p-4 shadow-md">
				<h2 className="mb-2 text-xl font-semibold">{person.name}</h2>
				{person.profile_path && (
					<img
						src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
						alt={person.name}
						className="mb-4 rounded"
					/>
				)}
				<p className="mb-2">
					<strong>Birthday:</strong> {person.birthday || 'Unknown'}
				</p>
				{person.deathday && (
					<p className="mb-2">
						<strong>Deathday:</strong> {person.deathday}
					</p>
				)}
				<p className="mb-4">
					<strong>Biography:</strong>{' '}
					{person.biography || 'No biography available.'}
				</p>

				<h3 className="mb-2 text-lg font-semibold">Known For</h3>
				<ul className="list-disc pl-5">
					{topMovies.map((movie) => (
						<li key={movie.id}>
							<Link
								to={`/movies/${movie.id}`}
								className="text-blue-600 hover:underline"
							>
								{movie.title} ({movie.character})
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
