import { json, type ActionFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/db.server'
import { requireUserId } from '#app/utils/auth.server'

export async function action({ params, request }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const { alternateEndingId } = params

  if (!alternateEndingId) {
    return json({ error: 'Alternate ending ID is required' }, { status: 400 })
  }

  const formData = await request.formData()
  const voteValue = Number(formData.get('voteValue'))

  if (typeof voteValue !== 'number' || (voteValue !== 1 && voteValue !== -1)) {
    return json({ error: 'Invalid vote value' }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findUnique({
        where: { userId_alternateEndingId: { userId, alternateEndingId } },
      })

      if (existingVote) {
        if (existingVote.value === voteValue) {
          // Remove vote if it's the same as existing
          await tx.vote.delete({
            where: { id: existingVote.id },
          })
          await tx.alternateEnding.update({
            where: { id: alternateEndingId },
            data: { score: { decrement: voteValue } },
          })
        } else {
          // Update vote if it's different
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { value: voteValue },
          })
          await tx.alternateEnding.update({
            where: { id: alternateEndingId },
            data: { score: { increment: voteValue * 2 } }, // Multiply by 2 because we're changing from -1 to 1 or vice versa
          })
        }
      } else {
        // Create new vote
        await tx.vote.create({
          data: {
            value: voteValue,
            userId,
            alternateEndingId,
          },
        })
        await tx.alternateEnding.update({
          where: { id: alternateEndingId },
          data: { score: { increment: voteValue } },
        })
      }

      return tx.alternateEnding.findUnique({
        where: { id: alternateEndingId },
        select: { score: true },
      })
    })

    return json({ score: result?.score })
  } catch (error) {
    console.error('Error voting:', error)
    return json({ error: 'Failed to vote' }, { status: 500 })
  }
}
