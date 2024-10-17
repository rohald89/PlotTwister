import { invariantResponse } from '@epic-web/invariant'
import {
	json,
	redirect,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { useLoaderData, Form } from '@remix-run/react'
import React from 'react'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)
	const contestId = url.searchParams.get('contestId')

	invariantResponse(contestId, 'Contest ID is required')

	const contest = await prisma.contest.findUnique({
		where: { id: contestId },
	})

	return json({ userId, contest })
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const tmdbMovieId = Number(formData.get('tmdbMovieId'))
	const title = formData.get('title') as string
	const content = formData.get('content') as string
	const contestId = formData.get('contestId') as string | null

	invariantResponse(!isNaN(tmdbMovieId), 'tmdbMovieId must be a valid number')
	invariantResponse(title, 'title is required')
	invariantResponse(content, 'content is required')

	const alternateEnding = await prisma.alternateEnding.create({
		data: {
			tmdbMovieId,
			title,
			content,
			authorId: userId,
			...(contestId ? { contestId } : {}),
		},
	})

	return redirect(
		`/movies/${tmdbMovieId}/alternate-endings/${alternateEnding.id}`,
	)
}

export default function NewAlternateEndingPage() {
	const { userId, contest } = useLoaderData<typeof loader>()

	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-4 text-2xl font-bold">
				{contest
					? `Submit Entry for "${contest.title}"`
					: 'Create New Alternate Ending'}
			</h1>
			<Form method="post" className="space-y-4">
				{contest && <input type="hidden" name="contestId" value={contest.id} />}
				<div>
					<label htmlFor="movieId" className="block">
						Movie ID
					</label>
					<input
						type="text"
						id="movieId"
						name="movieId"
						required
						className="w-full rounded border p-2"
					/>
				</div>
				<div>
					<label htmlFor="title" className="block">
						Title
					</label>
					<input
						type="text"
						id="title"
						name="title"
						required
						className="w-full rounded border p-2"
					/>
				</div>
				<div>
					<label htmlFor="content" className="block">
						Content
					</label>
					<textarea
						id="content"
						name="content"
						required
						className="h-40 w-full rounded border p-2"
					></textarea>
				</div>
				<button type="submit" className="btn btn-primary">
					{contest ? 'Submit Contest Entry' : 'Create Alternate Ending'}
				</button>
			</Form>
		</div>
	)
}
