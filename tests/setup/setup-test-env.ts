import 'dotenv/config'
import './db-setup.ts'
import '#app/utils/env.server.ts'
// we need these to be imported first 👆

import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi, type MockInstance } from 'vitest'
import { server } from '#tests/mocks/index.ts'
import { mockTopRatedMovies, mockMovie } from '../mocks/tmdb-data'
import './custom-matchers.ts'

afterEach(() => server.resetHandlers())
afterEach(() => cleanup())

export let consoleError: MockInstance<(typeof console)['error']>

beforeEach(() => {
	const originalConsoleError = console.error
	consoleError = vi.spyOn(console, 'error')
	consoleError.mockImplementation(
		(...args: Parameters<typeof console.error>) => {
			originalConsoleError(...args)
			throw new Error(
				'Console error was called. Call consoleError.mockImplementation(() => {}) if this is expected.',
			)
		},
	)
})

vi.mock('#app/utils/tmdb.server.ts', () => ({
  getTopRatedMovies: vi.fn().mockResolvedValue(mockTopRatedMovies),
  getMovie: vi.fn().mockResolvedValue(mockMovie),
}))
