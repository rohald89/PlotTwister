import { redirect } from '@remix-run/node'

export async function loader() {
	return redirect('/movies')
}

export default function Index() {
	return null
}
