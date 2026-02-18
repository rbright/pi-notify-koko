import jsPlugin from '@eslint/js';
import jsonPlugin from '@eslint/json';
import markdownPlugin from '@eslint/markdown';
import importPlugin from 'eslint-plugin-import';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import unusedImports from 'eslint-plugin-unused-imports';
import typescriptPlugin from 'typescript-eslint';

const sourceFiles = ['src/**/*.ts', '*.ts'];

export default [
  {
    ignores: [
      '**/.bun-tmp/**',
      '**/.coverage/**',
      'coverage/**',
      '**/coverage/**',
      'dist/**',
      '**/dist/**',
      'node_modules/**',
      '**/node_modules/**',
    ],
  },

  jsPlugin.configs.recommended,
  ...typescriptPlugin.configs.strict,
  ...typescriptPlugin.configs.stylistic,
  ...markdownPlugin.configs.recommended,
  prettierPluginRecommended,

  {
    plugins: {
      json: jsonPlugin,
    },
  },

  {
    files: ['**/*.json', '**/*.jsonc', '**/*.json5', '**/*.md'],
    rules: {
      'no-irregular-whitespace': 'off',
    },
  },

  {
    files: sourceFiles,
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          disallowTypeAnnotations: true,
          fixStyle: 'separate-type-imports',
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/unified-signatures': 'off',
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      'no-unused-vars': 'off',
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          disallowTypeAnnotations: false,
          fixStyle: 'separate-type-imports',
          prefer: 'type-imports',
        },
      ],
    },
  },

  {
    files: ['**/*.json'],
    language: 'json/json',
    ...jsonPlugin.configs.recommended,
  },

  {
    files: ['**/*.jsonc', '.vscode/*.json'],
    language: 'json/jsonc',
    ...jsonPlugin.configs.recommended,
  },

  {
    files: ['**/*.json5'],
    language: 'json/json5',
    ...jsonPlugin.configs.recommended,
  },

  {
    files: ['**/*.md'],
    rules: {
      'markdown/no-missing-label-refs': 'off',
      'prettier/prettier': 'off',
    },
  },
];
