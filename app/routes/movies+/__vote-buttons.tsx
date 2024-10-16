import { type AlternateEnding } from '@prisma/client'
import { type SerializeFrom } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { Icon } from '#app/components/ui/icon.tsx'

export function VoteButtons({
	alternateEnding,
	userVote,
}: {
	alternateEnding: SerializeFrom<AlternateEnding>
	userVote: number
}) {
	const voteFetcher = useFetcher()

	const handleVote = (value: number) => {
		voteFetcher.submit(
			{ voteValue: value },
			{
				method: 'post',
				action: `/api/alternate-endings/${alternateEnding.id}/vote`,
			},
		)
	}

	return (
		<div className="flex items-center space-x-2">
			<button
				onClick={() => handleVote(1)}
				className={`p-1 ${userVote === 1 ? 'text-green-500' : ''}`}
			>
				<Icon name="arrow-up" />
			</button>
			<span>{alternateEnding.score}</span>
			<button
				onClick={() => handleVote(-1)}
				className={`p-1 ${userVote === -1 ? 'text-red-500' : ''}`}
			>
				<Icon name="arrow-down" />
			</button>
		</div>
	)
}
