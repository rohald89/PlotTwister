import { default as defaultConfig } from '@epic-web/config/eslint'

/** @type {import("eslint").Linter.Config} */
export default [
	...defaultConfig,
	// add custom config objects here:
	{
		root: true,
		parserOptions: {
			tsconfigRootDir: __dirname,
			project: ['./tsconfig.json'],
		},
		ignorePatterns: ['.eslintrc.js'],
		overrides: [
			{
				files: ['*.ts', '*.tsx'],
				extends: [
					'plugin:@typescript-eslint/recommended',
					'plugin:@typescript-eslint/recommended-requiring-type-checking',
				],
			},
		],
	},
]
