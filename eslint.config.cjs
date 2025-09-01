const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');

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
    },
    rules: {
      // ===============================
      // CODE QUALITY RULES
      // ===============================

      // Enforce consistent brace style
      curly: ['error', 'all'],

      // Require strict equality operators
      eqeqeq: ['error', 'always'],

      // Disallow unused variables (ignore those starting with _)
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Disallow early returns when if-else can be used
      'no-else-return': 'error',

      // Warn about console statements (should use proper logging)
      'no-console': 'warn',

      // ===============================
      // IMPORT/MODULE RULES
      // ===============================

      // Ensure all imports are declared in package.json
      'import/no-extraneous-dependencies': 'error',

      // Sort and group imports for better readability
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-ins (fs, path, etc.)
            'external', // npm packages
            'internal', // your own modules
            ['parent', 'sibling', 'index'], // relative imports
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // ===============================
      // PRETTIER INTEGRATION
      // ===============================

      // Use Prettier for code formatting
      'prettier/prettier': 'error',

      // Disable ESLint formatting rules that conflict with Prettier
      'array-bracket-spacing': 'off',
      'comma-dangle': 'off',
      indent: 'off',
      'object-curly-spacing': 'off',
      quotes: 'off',
      semi: 'off',
    },
  },
];
