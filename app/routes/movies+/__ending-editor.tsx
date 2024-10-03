import {
	FormProvider,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type AlternateEnding } from '@prisma/client'
import { type SerializeFrom } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { useIsPending } from '#app/utils/misc.tsx'
import { type action } from './__ending-editor.server'
import { useState } from 'react'

const titleMinLength = 1
const titleMaxLength = 100
const contentMinLength = 1
const contentMaxLength = 10000

export const AlternateEndingEditorSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(titleMinLength).max(titleMaxLength),
	content: z.string().min(contentMinLength).max(contentMaxLength),
	prompt: z.string().min(1).max(500),
	tmdbMovieId: z.number(),
})

export function AlternateEndingEditor({
	alternateEnding,
	tmdbMovieId,
	movieTitle,
}: {
	alternateEnding?: SerializeFrom<
		Pick<AlternateEnding, 'id' | 'title' | 'content'>
	>
	tmdbMovieId: number
	movieTitle: string
}) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [content, setContent] = useState(alternateEnding?.content ?? '')
	const [title, setTitle] = useState(alternateEnding?.title ?? '')
	const [prompt, setPrompt] = useState('')

	const [form, fields] = useForm({
		id: 'alternate-ending-editor',
		constraint: getZodConstraint(AlternateEndingEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AlternateEndingEditorSchema })
		},
		defaultValue: {
			title,
			content,
			tmdbMovieId,
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<FormProvider context={form.context}>
			<Form
				method="POST"
				className="flex flex-col gap-y-4"
				{...getFormProps(form)}
			>
				{alternateEnding ? (
					<input type="hidden" name="id" value={alternateEnding.id} />
				) : null}
				<input type="hidden" name="tmdbMovieId" value={tmdbMovieId} />
				<Field
					labelProps={{ children: 'Prompt' }}
					inputProps={{
						...getInputProps(fields.prompt, { type: 'text' }),
						value: prompt,
						onChange: (e) => setPrompt(e.target.value),
						placeholder:
							'e.g., Frodo takes the ring and goes head to head with Sauron',
					}}
					errors={fields.prompt.errors}
				/>
				<Field
					labelProps={{ children: 'Title' }}
					inputProps={{
						autoFocus: true,
						...getInputProps(fields.title, { type: 'text' }),
						value: title,
						onChange: (e) => setTitle(e.target.value),
					}}
					errors={fields.title.errors}
				/>
				<Button
					type="button"
					variant="secondary"
					size="pill"
					onClick={() => generateTitle(movieTitle, prompt, setTitle)}
				>
					Generate Title
				</Button>
				<TextareaField
					labelProps={{ children: 'Content' }}
					textareaProps={{
						...getTextareaProps(fields.content),
						value: content,
						onChange: (e) => setContent(e.target.value),
					}}
					errors={fields.content.errors}
				/>
				<Button
					type="button"
					variant="secondary"
					size="pill"
					onClick={() => generateContent(movieTitle, prompt, setContent)}
				>
					Generate Content
				</Button>
				<ErrorList id={form.errorId} errors={form.errors} />
				<div className="flex justify-end gap-4">
					<Button
						form={form.id}
						variant="destructive"
						type="reset"
						onClick={() => {
							// because this is a controlled form, we need to reset the state
							// because the built-in browser behavior will no longer work.
							setContent(alternateEnding?.content ?? '')
							setTitle(alternateEnding?.title ?? '')
						}}
					>
						Reset
					</Button>
					<StatusButton
						type="submit"
						disabled={isPending}
						status={isPending ? 'pending' : 'idle'}
					>
						Submit
					</StatusButton>
				</div>
			</Form>
		</FormProvider>
	)
}

function generateTitle(
	movieTitle: string,
	prompt: string,
	setTitle: React.Dispatch<React.SetStateAction<string>>,
) {
	const sse = new EventSource(
		`/resources/completions?${new URLSearchParams({
			type: 'title',
			movieTitle,
			prompt,
		})}`,
	)
	setTitle('')
	sse.addEventListener('message', (event) => {
		setTitle((prevTitle) => prevTitle + event.data.replaceAll('␣', '\n'))
	})
	sse.addEventListener('error', (event) => {
		console.error('SSE Error:', event)
		setTitle('An error occurred while generating the title.')
		sse.close()
	})
	sse.addEventListener('done', () => {
		sse.close()
	})
}

function generateContent(
	movieTitle: string,
	prompt: string,
	setContent: React.Dispatch<React.SetStateAction<string>>,
) {
	const sse = new EventSource(
		`/resources/completions?${new URLSearchParams({
			type: 'content',
			movieTitle,
			prompt,
		})}`,
	)
	setContent('')
	sse.addEventListener('message', (event) => {
		setContent((prevContent) => prevContent + event.data.replaceAll('␣', '\n'))
	})
	sse.addEventListener('error', (event) => {
		console.log('error: ', event)
		sse.close()
	})
}
