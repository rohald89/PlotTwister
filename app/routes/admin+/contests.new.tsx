import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { parseWithZod } from '@conform-to/zod'
import { z } from 'zod'
import { useState } from 'react'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { useIsPending } from '#app/utils/misc.tsx'
import { DatePicker } from '#app/components/ui/date-picker'

const ContestSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
	theme: z.string().min(1, 'Theme is required'),
	startDate: z.string().min(1, 'Start date is required'),
	endDate: z.string().min(1, 'End date is required'),
	votingEndDate: z.string().min(1, 'Voting end date is required'),
})

export async function action({ request }: ActionFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: ContestSchema })

	if (submission.status !== 'success') {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { title, description, theme, startDate, endDate, votingEndDate } =
		submission.value

	const contest = await prisma.contest.create({
		data: {
			title,
			description,
			theme,
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			votingEndDate: new Date(votingEndDate),
			status: 'UPCOMING',
		},
	})

	return redirect(`/admin/contests/${contest.id}`)
}

export default function NewContest() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [startDate, setStartDate] = useState<Date>()
	const [endDate, setEndDate] = useState<Date>()
	const [votingEndDate, setVotingEndDate] = useState<Date>()

	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-4 text-2xl font-bold">Create New Contest</h1>
			<Form method="post" className="space-y-4">
				<Field
					labelProps={{ children: 'Title' }}
					inputProps={{
						name: 'title',
						type: 'text',
						required: true,
					}}
					errors={actionData?.submission?.error?.title}
				/>
				<TextareaField
					labelProps={{ children: 'Description' }}
					textareaProps={{
						name: 'description',
						required: true,
					}}
					errors={actionData?.submission?.error?.description}
				/>
				<Field
					labelProps={{ children: 'Theme' }}
					inputProps={{
						name: 'theme',
						type: 'text',
						required: true,
					}}
					errors={actionData?.submission?.error?.theme}
				/>
				<div>
					<label htmlFor="startDate">Start Date</label>
					<DatePicker date={startDate} setDate={setStartDate} />
					<input
						type="hidden"
						name="startDate"
						value={startDate?.toISOString()}
					/>
					{actionData?.submission?.error?.startDate && (
						<div className="text-red-500">
							{actionData.submission.error.startDate}
						</div>
					)}
				</div>
				<div>
					<label htmlFor="endDate">End Date</label>
					<DatePicker date={endDate} setDate={setEndDate} />
					<input type="hidden" name="endDate" value={endDate?.toISOString()} />
					{actionData?.submission?.error?.endDate && (
						<div className="text-red-500">
							{actionData.submission.error.endDate}
						</div>
					)}
				</div>
				<div>
					<label htmlFor="votingEndDate">Voting End Date</label>
					<DatePicker date={votingEndDate} setDate={setVotingEndDate} />
					<input
						type="hidden"
						name="votingEndDate"
						value={votingEndDate?.toISOString()}
					/>
					{actionData?.submission?.error?.votingEndDate && (
						<div className="text-red-500">
							{actionData.submission.error.votingEndDate}
						</div>
					)}
				</div>
				<div className="flex justify-end gap-4">
					<Button variant="secondary" type="reset">
						Reset
					</Button>
					<StatusButton type="submit" status={isPending ? 'pending' : 'idle'}>
						Create Contest
					</StatusButton>
				</div>
			</Form>
		</div>
	)
}
