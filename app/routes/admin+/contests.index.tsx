import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, Link } from '@remix-run/react'
import React from 'react'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const contests = await prisma.contest.findMany({
		orderBy: { startDate: 'desc' },
	})
	return json({ contests })
}

export default function AdminContests() {
	const { contests } = useLoaderData<typeof loader>()

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
							<td>{contest.title}</td>
							<td>{contest.theme}</td>
							<td>{new Date(contest.startDate).toLocaleDateString()}</td>
							<td>{new Date(contest.endDate).toLocaleDateString()}</td>
							<td>{contest.status}</td>
							<td>
								<Link
									to={`${contest.id}/edit`}
									className="btn btn-sm btn-secondary mr-2"
								>
									Edit
								</Link>
								<Link
									to={`${contest.id}/delete`}
									className="btn btn-sm btn-error"
								>
									Delete
								</Link>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
