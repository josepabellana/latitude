import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      exclude: ['**/__tests__', '**/*.test.ts'],
    }),
  ],
  external: [
    'svelte/compiler',
    '@latitude-sdk/athena-connector',
    '@latitude-sdk/postgresql-connector',
    '@latitude-sdk/bigquery-connector',
    '@latitude-sdk/mysql-connector',
    '@latitude-sdk/snowflake-connector',
    'yaml',
    'fs',
    'path',
  ],
}