import { invariantResponse } from '@epic-web/invariant'
import { z } from 'zod'
import { cachified, cache } from '#app/utils/cache.server.ts'
import { type Timings } from '#app/utils/timing.server.ts'

const TMDB_API_BASE_URL = 'https://api.themoviedb.org'

const castMemberSchema = z.object({
    id: z.number(),
    name: z.string(),
    character: z.string(),
    profile_path: z.string().nullable(),
})

export const movieSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string(),
  backdrop_path: z.string().nullable(),
  poster_path: z.string().nullable(),
  release_date: z.string(),
  vote_average: z.number(),
  // Made optional as these will not be returned on top rated query
  runtime: z.number().optional(),
  credits: z.object({
    cast: z.array(castMemberSchema)
  }).optional()
  // Add other properties as needed
})

export type Movie = z.infer<typeof movieSchema>

const topRatedMoviesSchema = z.object({
  results: z.array(movieSchema),
  total_pages: z.number(),
  // Add other properties as needed
})

type TopRatedMoviesResponse = z.infer<typeof topRatedMoviesSchema>

async function tmdbRequest<T>(endpoint: string): Promise<T> {
  const url = new URL(endpoint, TMDB_API_BASE_URL)
  url.searchParams.append('api_key', process.env.TMDB_API_KEY!)
  url.searchParams.append('language', 'en-US')

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`TMDB API request failed: ${response.status} ${response.statusText}\nEndpoint: ${url.toString()}\nResponse: ${errorBody}`)
  }

  return response.json() as T
}

export async function getMovie(movieId: string, { timings }: { timings?: Timings } = {}): Promise<Movie> {
  const movie = await cachified({
    key: `tmdb:movie:${movieId}`,
    cache,
    timings,
    getFreshValue: () => tmdbRequest<Movie>(`/3/movie/${movieId}?append_to_response=credits`),
    checkValue: movieSchema,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
    staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
  invariantResponse(movie, 'Movie not found', { status: 404 })
  return movie
}

export async function getTopRatedMovies(
  page: number = 1,
  { timings }: { timings?: Timings } = {}
): Promise<TopRatedMoviesResponse> {
  return cachified({
    key: `tmdb:top-rated-movies:${page}`,
    cache,
    timings,
    getFreshValue: () => tmdbRequest<TopRatedMoviesResponse>(`/3/movie/top_rated?page=${page}`),
    checkValue: topRatedMoviesSchema,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
    staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
}

// Add other TMDB API functions as needed
