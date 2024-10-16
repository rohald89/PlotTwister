import { cva } from 'class-variance-authority'

const ratingSize = cva('relative', {
	variants: {
		size: {
			sm: 'h-8 w-8 md:h-12 md:w-12',
			md: 'h-12 w-12 md:h-16 md:w-16',
			lg: 'h-16 w-16 md:h-20 md:w-20',
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

const ratingText = cva(
	'absolute inset-0 flex items-center justify-center font-bold',
	{
		variants: {
			size: {
				sm: 'text-xs md:text-sm',
				md: 'text-sm md:text-base',
				lg: 'text-base md:text-lg',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	},
)

export function MovieRating({
	vote_average,
	size = 'md',
}: {
	vote_average: number
	size?: 'sm' | 'md' | 'lg'
}) {
	return (
		<div className={ratingSize({ size })}>
			<svg className="h-full w-full" viewBox="0 0 36 36">
				<path
					d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeDasharray={`${vote_average * 10}, 100`}
					className="stroke-primary"
				/>
			</svg>
			<div className={ratingText({ size })}>{vote_average.toFixed(1)}</div>
		</div>
	)
}
