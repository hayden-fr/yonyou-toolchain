// @ts-check
import eslint from '@eslint/js'
import globals from 'globals'
import tsEslint from 'typescript-eslint'

export default tsEslint.config(
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...tsEslint.configs.stylistic,
)
