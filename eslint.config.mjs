import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Accessibility rules for the React code (the frontend is the only place with JSX).
  { ...jsxA11y.flatConfigs.strict, files: ['frontend/**/*.tsx'] },
  prettier,
);
