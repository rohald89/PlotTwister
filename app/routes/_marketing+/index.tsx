import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'

export default function Index() {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<header className="container mx-auto px-4 py-16 text-center">
				<h1 className="mb-4 text-5xl font-bold text-primary">
					Welcome to PlotTwisters
				</h1>
				<p className="text-xl text-muted-foreground">
					Rewrite cinema history, one ending at a time
				</p>
				<p>
					PlotTwisters is a web application that allows users to discover
					movies, view details about films and actors, and create and share
					alternate endings for their favorite movies.
				</p>
				<p>
					Excuse the boring landing page, I promise it'll get better from here.
				</p>
			</header>

			<main className="container mx-auto flex-grow px-4">
				<section className="mb-16">
					<h2 className="mb-8 text-3xl font-semibold text-primary">
						Unleash Your Creativity
					</h2>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						<FeatureCard
							title="Discover & Explore"
							description="Dive into a vast library of films from every era and genre"
							icon="search"
						/>
						<FeatureCard
							title="Rewrite Endings"
							description="Craft and share your own alternate endings to beloved movies"
							icon="pen-tool"
						/>
						<FeatureCard
							title="Connect & Engage"
							description="Join a community of film enthusiasts and creative minds"
							icon="users"
						/>
						<FeatureCard
							title="Vote & Rank"
							description="Influence the popularity of alternate endings with your votes"
							icon="thumbs-up"
						/>
					</div>
				</section>

				<section className="mb-16">
					<h2 className="mb-8 text-3xl font-semibold text-primary">
						Coming Soon: Themed Contests
					</h2>
					<div className="rounded-lg border border-primary bg-primary/10 p-6">
						<h3 className="mb-4 text-2xl font-semibold text-primary">
							Community Challenges
						</h3>
						<ul className="mb-6 list-inside list-disc space-y-2">
							<li>Weekly themed contests for alternative endings</li>
							<li>Exclusive submission process for contest entries</li>
							<li>Community voting period for each contest</li>
							<li>Spotlight showcase for winning entries</li>
						</ul>
						<p className="italic text-muted-foreground">
							Get ready for an exciting new feature that will spark your
							creativity and bring our community together in thrilling cinematic
							challenges!
						</p>
					</div>
				</section>

				<div className="text-center">
					<Link to="/movies">
						<Button
							size="lg"
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							Start Your Cinematic Journey
							<Icon name="arrow-right" className="ml-2" />
						</Button>
					</Link>
				</div>
			</main>
		</div>
	)
}

function FeatureCard({
	title,
	description,
	icon,
}: {
	title: string
	description: string
	icon: string
}) {
	return (
		<div className="rounded-lg border border-primary/20 bg-card p-6 shadow-sm transition-all hover:shadow-md">
			<Icon name={icon} className="mb-4 h-8 w-8 text-primary" />
			<h3 className="mb-2 text-xl font-semibold text-primary">{title}</h3>
			<p className="text-muted-foreground">{description}</p>
		</div>
	)
}
