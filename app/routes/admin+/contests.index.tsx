import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { useLoaderData, Link, useFetcher } from '@remix-run/react'
import React from 'react'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { Button } from '#app/components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from '#app/components/ui/dropdown-menu.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const contests = await prisma.contest.findMany({
		orderBy: { startDate: 'desc' },
	})
	return json({ contests })
}

export async function action({ request }: ActionFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const formData = await request.formData()
	const contestId = formData.get('contestId') as string
	const status = formData.get('status') as string

	await prisma.contest.update({
		where: { id: contestId },
		data: { status },
	})

	return json({ success: true })
}

export default function AdminContests() {
	const { contests } = useLoaderData<typeof loader>()
	const fetcher = useFetcher()

	const handleStatusChange = (contestId: string, newStatus: string) => {
		fetcher.submit({ contestId, status: newStatus }, { method: 'POST' })
	}

	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-4 text-2xl font-bold">Manage Contests</h1>
			<Link to="new" className="btn btn-primary mb-4">
				Create New Contest
			</Link>
			<table className="w-full">
				<thead>
					<tr>
						<th>Title</th>
						<th>Theme</th>
						<th>Start Date</th>
						<th>End Date</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{contests.map((contest) => (
						<tr key={contest.id}>
							<td>
								<Link to={contest.id} className="text-blue-600 hover:underline">
									{contest.title}
								</Link>
							</td>
							<td>{contest.theme}</td>
							<td>{new Date(contest.startDate).toLocaleDateString()}</td>
							<td>{new Date(contest.endDate).toLocaleDateString()}</td>
							<td>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline">{contest.status}</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{['UPCOMING', 'ACTIVE', 'VOTING', 'COMPLETED'].map(
											(status) => (
												<DropdownMenuItem
													key={status}
													onSelect={() =>
														handleStatusChange(contest.id, status)
													}
												>
													{status}
												</DropdownMenuItem>
											),
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							</td>
							<td>
								<Link
									to={`${contest.id}/edit`}
									className="btn btn-sm btn-secondary mr-2"
								>
									Edit
								</Link>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										/* Implement delete functionality */
									}}
								>
									Delete
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
