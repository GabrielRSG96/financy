import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['./tests/helpers/global-setup.ts'],
    include: ['tests/**/*.test.ts'],
    // Cada arquivo de teste roda em seu próprio banco SQLite; sem isolamento de
    // processo os arquivos disputariam o mesmo DATABASE_URL.
    pool: 'forks',
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'segredo-apenas-para-testes',
      JWT_EXPIRES_IN: '1h',
      DATABASE_URL: 'file:./test-template.db',
    },
  },
})
