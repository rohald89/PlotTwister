import { invariantResponse } from '@epic-web/invariant'

const TMDB_API_BASE_URL = 'https://api.themoviedb.org'

interface Movie {
  id: number
  title: string
  backdrop_path: string
  poster_path: string
  // Add other properties as needed
}

interface TopRatedMoviesResponse {
  results: Movie[]
  // Add other properties as needed
}

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

export async function getMovie(movieId: string): Promise<Movie> {
  const movie = await tmdbRequest<Movie>(`/3/movie/${movieId}`)
  invariantResponse(movie, 'Movie not found', { status: 404 })
  return movie
}

export async function getTopRatedMovies(page: number = 1): Promise<TopRatedMoviesResponse> {
  return tmdbRequest<TopRatedMoviesResponse>(`/3/movie/top_rated?page=${page}`)
}

// Add other TMDB API functions as needed
