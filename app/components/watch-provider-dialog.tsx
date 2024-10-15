import React from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '#app/components/ui/dialog'
import { Icon } from '#app/components/ui/icon'

interface WatchProvidersDialogProps {
	isOpen: boolean
	onClose: () => void
	movieTitle: string
	watchProviders: any
	country: string
}

export function WatchProvidersDialog({
	isOpen,
	onClose,
	movieTitle,
	watchProviders,
	country,
}: WatchProvidersDialogProps) {
	const usProviders = watchProviders.results[country] || {}

	const renderProviders = (providers: any[] | undefined) => {
		if (!providers) return null
		return (
			<div className="flex flex-wrap gap-4">
				{providers.map((provider) => (
					<div
						key={provider.provider_id}
						className="flex flex-col items-center"
					>
						<img
							src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
							alt={provider.provider_name}
							className="h-16 w-16 object-contain"
						/>
						<span className="mt-1 text-center text-xs">
							{provider.provider_name}
						</span>
					</div>
				))}
			</div>
		)
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[800px]">
				<DialogHeader>
					<DialogTitle>
						{movieTitle} - Watch Providers ({country})
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-6">
					{usProviders.flatrate && (
						<div>
							<h3 className="mb-2 text-lg font-semibold">Stream</h3>
							{renderProviders(usProviders.flatrate)}
						</div>
					)}
					{usProviders.rent && (
						<div>
							<h3 className="mb-2 text-lg font-semibold">Rent</h3>
							{renderProviders(usProviders.rent)}
						</div>
					)}
					{usProviders.buy && (
						<div>
							<h3 className="mb-2 text-lg font-semibold">Buy</h3>
							{renderProviders(usProviders.buy)}
						</div>
					)}
				</div>
				<div className="mt-4 flex items-center justify-end text-sm text-gray-500">
					<span>Data provided by JustWatch</span>
				</div>
			</DialogContent>
		</Dialog>
	)
}
