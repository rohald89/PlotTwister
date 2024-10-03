// mocks/tmdb.ts
import { http, HttpResponse } from 'msw'
import { mockTopRatedMovies, mockMovie } from './tmdb-data'

export function createTmdbHandlers() {
  return [
    http.get('https://api.themoviedb.org/3/movie/top_rated', () => {
      return HttpResponse.json(mockTopRatedMovies)
    }),
    http.get('https://api.themoviedb.org/3/movie/:movieId', ({ params }) => {
      return HttpResponse.json({ ...mockMovie, id: Number(params.movieId) })
    }),
  ]
}
