module.exports = {
  root: true,
  env: {
    node: true,
    es2023: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
    'prettier'
  ],
  ignorePatterns: ['dist', 'node_modules']
};
