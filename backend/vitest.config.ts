import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['./tests/helpers/global-setup.ts'],
    include: ['tests/**/*.test.ts'],
    pool: 'forks',
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'segredo-apenas-para-testes',
      JWT_EXPIRES_IN: '1h',
      DATABASE_URL: 'file:./test-template.db',
      UPLOADS_DIR: './uploads-test',
      PUBLIC_URL: 'http://localhost:4000',
    },
  },
})
