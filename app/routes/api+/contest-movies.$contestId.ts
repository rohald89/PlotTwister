import { json, type ActionFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { getMovieDetails } from '#app/utils/tmdb.server.ts'

export async function action({ params, request }: ActionFunctionArgs) {
  await requireUserWithRole(request, 'admin')
  const contestId = params.contestId
  const formData = await request.formData()
  const movieId = Number(formData.get('movieId'))
  const action = formData.get('action')

  if (action === 'add') {
    const movieDetails = await getMovieDetails(movieId)
    await prisma.contestMovie.create({
      data: {
        contest: { connect: { id: contestId } },
        tmdbMovieId: movieId,
        title: movieDetails.title,
        posterPath: movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : '',
      },
    })
  } else if (action === 'remove') {
    await prisma.contestMovie.deleteMany({
      where: {
        contestId,
        tmdbMovieId: movieId,
      },
    })
  }

  const updatedContest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: { movies: true },
  })

  return json({ contestMovies: updatedContest?.movies || [] })
}
