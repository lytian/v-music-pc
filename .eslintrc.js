module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  rules: {
    'no-use-before-define': 'off',
    'space-before-function-paren': 'off',
    'vue/script-setup-uses-vars': 'error',
    'vue/custom-event-name-casing': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': [
      'off',
      {
        vars: 'all',
        // args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
};
