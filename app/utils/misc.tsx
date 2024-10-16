import { useFormAction, useNavigation } from '@remix-run/react'
import { clsx, type ClassValue } from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSpinDelay } from 'spin-delay'
import { extendTailwindMerge } from 'tailwind-merge'
import { extendedTheme } from './extended-theme.ts'

export function getUserImgSrc(imageId?: string | null) {
	return imageId ? `/resources/user-images/${imageId}` : '/img/user.png'
}

export function getNoteImgSrc(imageId: string) {
	return `/resources/note-images/${imageId}`
}

export function getErrorMessage(error: unknown) {
	if (typeof error === 'string') return error
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}
	console.error('Unable to get error message for error', error)
	return 'Unknown Error'
}

function formatColors() {
	const colors = []
	for (const [key, color] of Object.entries(extendedTheme.colors)) {
		if (typeof color === 'string') {
			colors.push(key)
		} else {
			const colorGroup = Object.keys(color).map((subKey) =>
				subKey === 'DEFAULT' ? '' : subKey,
			)
			colors.push({ [key]: colorGroup })
		}
	}
	return colors
}

const customTwMerge = extendTailwindMerge<string, string>({
	extend: {
		theme: {
			colors: formatColors(),
			borderRadius: Object.keys(extendedTheme.borderRadius),
		},
		classGroups: {
			'font-size': [
				{
					text: Object.keys(extendedTheme.fontSize),
				},
			],
		},
	},
})

export function cn(...inputs: ClassValue[]) {
	return customTwMerge(clsx(inputs))
}

export function getDomainUrl(request: Request) {
	const host =
		request.headers.get('X-Forwarded-Host') ??
		request.headers.get('host') ??
		new URL(request.url).host
	const protocol = request.headers.get('X-Forwarded-Proto') ?? 'http'
	return `${protocol}://${host}`
}

export function getReferrerRoute(request: Request) {
	// spelling errors and whatever makes this annoyingly inconsistent
	// in my own testing, `referer` returned the right value, but 🤷‍♂️
	const referrer =
		request.headers.get('referer') ??
		request.headers.get('referrer') ??
		request.referrer
	const domain = getDomainUrl(request)
	if (referrer?.startsWith(domain)) {
		return referrer.slice(domain.length)
	} else {
		return '/'
	}
}

/**
 * Merge multiple headers objects into one (uses set so headers are overridden)
 */
export function mergeHeaders(
	...headers: Array<ResponseInit['headers'] | null | undefined>
) {
	const merged = new Headers()
	for (const header of headers) {
		if (!header) continue
		for (const [key, value] of new Headers(header).entries()) {
			merged.set(key, value)
		}
	}
	return merged
}

/**
 * Combine multiple header objects into one (uses append so headers are not overridden)
 */
export function combineHeaders(
	...headers: Array<ResponseInit['headers'] | null | undefined>
) {
	const combined = new Headers()
	for (const header of headers) {
		if (!header) continue
		for (const [key, value] of new Headers(header).entries()) {
			combined.append(key, value)
		}
	}
	return combined
}

/**
 * Combine multiple response init objects into one (uses combineHeaders)
 */
export function combineResponseInits(
	...responseInits: Array<ResponseInit | null | undefined>
) {
	let combined: ResponseInit = {}
	for (const responseInit of responseInits) {
		combined = {
			...responseInit,
			headers: combineHeaders(combined.headers, responseInit?.headers),
		}
	}
	return combined
}

/**
 * Returns true if the current navigation is submitting the current route's
 * form. Defaults to the current route's form action and method POST.
 *
 * Defaults state to 'non-idle'
 *
 * NOTE: the default formAction will include query params, but the
 * navigation.formAction will not, so don't use the default formAction if you
 * want to know if a form is submitting without specific query params.
 */
export function useIsPending({
	formAction,
	formMethod = 'POST',
	state = 'non-idle',
}: {
	formAction?: string
	formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
	state?: 'submitting' | 'loading' | 'non-idle'
} = {}) {
	const contextualFormAction = useFormAction()
	const navigation = useNavigation()
	const isPendingState =
		state === 'non-idle'
			? navigation.state !== 'idle'
			: navigation.state === state
	return (
		isPendingState &&
		navigation.formAction === (formAction ?? contextualFormAction) &&
		navigation.formMethod === formMethod
	)
}

/**
 * This combines useSpinDelay (from https://npm.im/spin-delay) and useIsPending
 * from our own utilities to give you a nice way to show a loading spinner for
 * a minimum amount of time, even if the request finishes right after the delay.
 *
 * This avoids a flash of loading state regardless of how fast or slow the
 * request is.
 */
export function useDelayedIsPending({
	formAction,
	formMethod,
	delay = 400,
	minDuration = 300,
}: Parameters<typeof useIsPending>[0] &
	Parameters<typeof useSpinDelay>[1] = {}) {
	const isPending = useIsPending({ formAction, formMethod })
	const delayedIsPending = useSpinDelay(isPending, {
		delay,
		minDuration,
	})
	return delayedIsPending
}

function callAll<Args extends Array<unknown>>(
	...fns: Array<((...args: Args) => unknown) | undefined>
) {
	return (...args: Args) => fns.forEach((fn) => fn?.(...args))
}

/**
 * Use this hook with a button and it will make it so the first click sets a
 * `doubleCheck` state to true, and the second click will actually trigger the
 * `onClick` handler. This allows you to have a button that can be like a
 * "are you sure?" experience for the user before doing destructive operations.
 */
export function useDoubleCheck() {
	const [doubleCheck, setDoubleCheck] = useState(false)

	function getButtonProps(
		props?: React.ButtonHTMLAttributes<HTMLButtonElement>,
	) {
		const onBlur: React.ButtonHTMLAttributes<HTMLButtonElement>['onBlur'] =
			() => setDoubleCheck(false)

		const onClick: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'] =
			doubleCheck
				? undefined
				: (e) => {
						e.preventDefault()
						setDoubleCheck(true)
					}

		const onKeyUp: React.ButtonHTMLAttributes<HTMLButtonElement>['onKeyUp'] = (
			e,
		) => {
			if (e.key === 'Escape') {
				setDoubleCheck(false)
			}
		}

		return {
			...props,
			onBlur: callAll(onBlur, props?.onBlur),
			onClick: callAll(onClick, props?.onClick),
			onKeyUp: callAll(onKeyUp, props?.onKeyUp),
		}
	}

	return { doubleCheck, getButtonProps }
}

/**
 * Simple debounce implementation
 */
function debounce<Callback extends (...args: Parameters<Callback>) => void>(
	fn: Callback,
	delay: number,
) {
	let timer: ReturnType<typeof setTimeout> | null = null
	return (...args: Parameters<Callback>) => {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			fn(...args)
		}, delay)
	}
}

/**
 * Debounce a callback function
 */
export function useDebounce<
	Callback extends (...args: Parameters<Callback>) => ReturnType<Callback>,
>(callback: Callback, delay: number) {
	const callbackRef = useRef(callback)
	useEffect(() => {
		callbackRef.current = callback
	})
	return useMemo(
		() =>
			debounce(
				(...args: Parameters<Callback>) => callbackRef.current(...args),
				delay,
			),
		[delay],
	)
}

export async function downloadFile(url: string, retries: number = 0) {
	const MAX_RETRIES = 3
	try {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`Failed to fetch image with status ${response.status}`)
		}
		const contentType = response.headers.get('content-type') ?? 'image/jpg'
		const blob = Buffer.from(await response.arrayBuffer())
		return { contentType, blob }
	} catch (e) {
		if (retries > MAX_RETRIES) throw e
		return downloadFile(url, retries + 1)
	}
}

export function formatVoteCount(num: number) {
	if (num > 1000) {
		return (num / 1000).toFixed(1) + 'K'
	} else {
		return num.toString()
	}
}
// ... existing imports and functions

const recommendationPhrases = {
	high: [
		'Caution: This cinematic masterpiece may cause your expectations for all future movies to skyrocket unreasonably.',
		"Warning: Watching this movie might make you question why you've wasted time on lesser films.",
		'Alert: This film is so good, it might ruin other movies for you. Proceed with caution.',
		"Heads up: This movie is like pizza - even when it's not perfect, it's still pretty great.",
		'PSA: This film is a certified banger. Your eyeballs will thank you.',
	],
	good: [
		"If movies were desserts, this one's a respectable tiramisu. Not everyone's fave, but crowd-pleasing!",
		'This movie is like a Swiss Army knife - not always pretty, but gets the job done.',
		"Think of this film as the 'comfort food' of cinema. It might not win awards, but it'll make you feel good.",
		'This movie is like a good hair day - not life-changing, but definitely makes things better.',
		"If this film were a person, it'd be the friend who always remembers your birthday. Reliable and appreciated.",
	],
	average: [
		"It's the 'pizza with pineapple' of movies - controversial, but has its fans!",
		'This film is like a Monday - not terrible, but not exactly exciting either.',
		'If this movie were a spice, it would be flour. Present, necessary, but not particularly thrilling.',
		'This film is the equivalent of a participation trophy in the movie world.',
		"Watching this movie is like eating a rice cake - it's fine, but you know there are tastier options out there.",
	],
	below_average: [
		"Watch it for the 'I survived this movie' bragging rights!",
		'This film is like a bad haircut - not permanent, but you might want to hide for a while after experiencing it.',
		"If this movie were a food, it would be plain oatmeal. Edible, but you'll probably want to add something to make it interesting.",
		"This film is the cinematic equivalent of lukewarm coffee. It exists, but it's not bringing joy to anyone.",
		'Watching this movie is like doing laundry - not fun, but you might feel accomplished after for some reason.',
	],
	low: [
		"Yikes! You'd have more fun watching paint dry.",
		"This movie is so bad, it might circle back to good... Nope, never mind, it's just bad.",
		'If this film were a person, it would be that one who always tells the same unfunny joke at parties.',
		"Watching this movie is like stepping on a Lego brick - painful and you'll question why you put yourself through it.",
		'This film is the cinematic equivalent of a soggy sandwich. Disappointing and leaves you wondering where it all went wrong.',
	],
} as const

type RecommendationCategory = keyof typeof recommendationPhrases

export function getRecommendationString(rating: number): string {
	let category: RecommendationCategory
	if (rating >= 8) {
		category = 'high'
	} else if (rating >= 7) {
		category = 'good'
	} else if (rating >= 6) {
		category = 'average'
	} else if (rating >= 5) {
		category = 'below_average'
	} else {
		category = 'low'
	}

	const phrases = recommendationPhrases[category]
	const randomIndex = Math.floor(Math.random() * phrases.length)
	return phrases[randomIndex] || "We don't know what people think of this movie"
}

export function formatRuntime(runtime: number) {
	const hours = Math.floor(runtime / 60)
	const minutes = runtime % 60
	return `${hours}h ${minutes}min`
}

export function getReleaseYear(date: string) {
	return date.split('-')[0]
}
