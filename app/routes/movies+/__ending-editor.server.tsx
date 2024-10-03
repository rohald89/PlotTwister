import { parseWithZod } from '@conform-to/zod'
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { AlternateEndingEditorSchema } from './__ending-editor'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: AlternateEndingEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const alternateEnding = await prisma.alternateEnding.findUnique({
				select: { id: true },
				where: { id: data.id, authorId: userId },
			})
			if (!alternateEnding) {
				ctx.addIssue({
					code: 'custom',
					message: 'Alternate Ending not found',
				})
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const {
		id: alternateEndingId,
		title,
		content,
		tmdbMovieId,
	} = submission.value

	const alternateEnding = await prisma.alternateEnding.upsert({
		select: { id: true },
		where: { id: alternateEndingId ?? '__new_alternate_ending__' },
		create: {
			authorId: userId,
			title,
			content,
			tmdbMovieId,
		},
		update: {
			title,
			content,
		},
	})

	return redirect(`/movies/${tmdbMovieId}`)
}
