const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');
const promisePlugin = require('eslint-plugin-promise');
const sortDestructureKeysPlugin = require('eslint-plugin-sort-destructure-keys');
const sortKeysFixPlugin = require('eslint-plugin-sort-keys-fix');

module.exports = [
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        __dirname: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
      sourceType: 'module',
    },
    plugins: {
      import: importPlugin,

      prettier: prettierPlugin,

      promise: promisePlugin,

      'sort-destructure-keys': sortDestructureKeysPlugin,
      'sort-keys-fix': sortKeysFixPlugin,
    },
    rules: {
      'array-bracket-spacing': 'off',

      'callback-return': 'off',

      'comma-dangle': 'off',

      curly: ['error', 'all'],

      eqeqeq: ['error', 'always'],

      'global-require': 'off',

      'handle-callback-err': 'warn',

      // 🔑 Ensure dependencies are declared in package.json
      'import/no-extraneous-dependencies': 'error',

      // 🔑 Sort and group imports/requires
      'import/order': [
        'error',
        {
          alphabetize: {
            // A → Z
            caseInsensitive: true,
            order: 'asc',
          },

          groups: [
            'builtin', // Node.js built-ins (fs, path, etc.)
            'external', // npm packages
            'internal', // your own modules (like src/, @/)
            ['parent', 'sibling', 'index'], // relative imports
            'object',
            'type', // TypeScript types
          ],

          'newlines-between': 'always',
        },
      ],

      // 🚫 Remove stylistic overlaps (Prettier handles these)
      indent: 'off',

      'no-buffer-constructor': 'error',

      'no-console': 'warn',

      'no-else-return': 'error',

      'no-mixed-requires': 'warn',

      'no-new-require': 'error',

      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      'object-curly-spacing': 'off',

      // ✅ Prettier as ESLint rule
      'prettier/prettier': 'error',

      'promise/always-return': 'off',

      // ✅ Forces you to handle promises (avoid silent errors)
      'promise/catch-or-return': 'error',

      quotes: 'off',

      semi: 'off',

      // 🔑 Sort destructured object keys
      'sort-destructure-keys/sort-destructure-keys': [
        'error',
        { caseSensitive: false },
      ],
      // 🔑 Sort object keys (e.g., module.exports)
      'sort-keys-fix/sort-keys-fix': 'warn',
    },
  },
];
