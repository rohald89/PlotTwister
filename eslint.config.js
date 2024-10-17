import { default as defaultConfig } from '@epic-web/config/eslint'

/** @type {import("eslint").Linter.Config} */
export default [
	...defaultConfig,
	// add custom config objects here:
	{
		parserOptions: {
			project: './tsconfig.json',
			projectService: {
				maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 20, // or whatever number you need
			},
		},
	},
]
