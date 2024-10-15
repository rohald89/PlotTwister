import React from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '#app/components/ui/dialog'

interface MovieTrailerDialogProps {
	isOpen: boolean
	onClose: () => void
	movieTitle: string
	trailerKey: string
}

export function MovieTrailerDialog({
	isOpen,
	onClose,
	movieTitle,
	trailerKey,
}: MovieTrailerDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[800px]">
				<DialogHeader>
					<DialogTitle>{movieTitle} - Trailer</DialogTitle>
				</DialogHeader>
				<div className="aspect-video">
					<iframe
						width="100%"
						height="100%"
						src={`https://www.youtube.com/embed/${trailerKey}`}
						title={`${movieTitle} trailer`}
						frameBorder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					></iframe>
				</div>
			</DialogContent>
		</Dialog>
	)
}
