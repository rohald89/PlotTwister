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

const baseMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string(),
  backdrop_path: z.string().nullable(),
  poster_path: z.string().nullable(),
  release_date: z.string(),
  vote_average: z.number(),
  vote_count: z.number(),
})

export const movieListItemSchema = baseMovieSchema

export const fullMovieSchema = baseMovieSchema.extend({
  runtime: z.number(),
  genres: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })),
  credits: z.object({
    cast: z.array(castMemberSchema)
  }),
  videos: z.object({
    results: z.array(z.object({
      key: z.string(),
      site: z.string(),
      type: z.string(),
    })),
  }),
  'watch/providers': z.object({
    results: z.record(z.object({
      link: z.string(),
      flatrate: z.array(z.object({
        logo_path: z.string(),
        provider_id: z.number(),
        provider_name: z.string(),
        display_priority: z.number(),
      })).optional(),
      rent: z.array(z.object({
        logo_path: z.string(),
        provider_id: z.number(),
        provider_name: z.string(),
        display_priority: z.number(),
      })).optional(),
      buy: z.array(z.object({
        logo_path: z.string(),
        provider_id: z.number(),
        provider_name: z.string(),
        display_priority: z.number(),
      })).optional(),
    }).passthrough())
  }),
  recommendations: z.object({
    results: z.array(movieListItemSchema)
  })
})

export type MovieListItem = z.infer<typeof movieListItemSchema>
export type FullMovie = z.infer<typeof fullMovieSchema>

const movieListSchema = z.object({
  results: z.array(movieListItemSchema),
  total_pages: z.number(),
  page: z.number(),
  total_results: z.number(),
})

type MovieListResponse = z.infer<typeof movieListSchema>

const popularMoviesSchema = z.object({
  results: z.array(movieListItemSchema),
  total_pages: z.number(),
  page: z.number(),
  total_results: z.number(),
})

type PopularMoviesResponse = z.infer<typeof popularMoviesSchema>

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

export async function getMovie(movieId: string, { timings }: { timings?: Timings } = {}): Promise<FullMovie> {
  const movie = await cachified({
    key: `tmdb:movie:${movieId}`,
    cache,
    timings,
    getFreshValue: () => tmdbRequest<FullMovie>(`/3/movie/${movieId}?append_to_response=credits,videos,watch/providers,recommendations`),
    checkValue: fullMovieSchema,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
    staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
  invariantResponse(movie, 'Movie not found', { status: 404 })
  return movie
}

export async function getTopRatedMovies(
  page: number = 1,
  { timings }: { timings?: Timings } = {}
): Promise<MovieListResponse> {
  return cachified({
    key: `tmdb:top-rated-movies:${page}`,
    cache,
    timings,
    getFreshValue: () => tmdbRequest<MovieListResponse>(`/3/movie/top_rated?page=${page}`),
    checkValue: movieListSchema,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
    staleWhileRevalidate: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
}

export async function getPopularMovies(
  page: number = 1,
  { timings }: { timings?: Timings } = {}
): Promise<PopularMoviesResponse> {
  return cachified({
    key: `tmdb:popular-movies:${page}`,
    cache,
    timings,
    getFreshValue: () => tmdbRequest<PopularMoviesResponse>(`/3/movie/popular?page=${page}`),
    checkValue: popularMoviesSchema,
    ttl: 1000 * 60 * 60, // 1 hour
    staleWhileRevalidate: 1000 * 60 * 60 * 24, // 24 hours
  })
}

export async function searchMovies(
  query: string,
  page: number = 1,
  { timings }: { timings?: Timings } = {}
): Promise<PopularMoviesResponse> {
  return cachified({
    key: `tmdb:search-movies:${query}:${page}`,
    cache,
    timings,
    getFreshValue: () => tmdbRequest<PopularMoviesResponse>(`/3/search/movie?query=${encodeURIComponent(query)}&page=${page}`),
    checkValue: popularMoviesSchema,
    ttl: 1000 * 60 * 60, // 1 hour
    staleWhileRevalidate: 1000 * 60 * 60 * 24, // 24 hours
  })
}

// Add other TMDB API functions as needed
