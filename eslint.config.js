// @ts-check
import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import globals from 'globals'

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
