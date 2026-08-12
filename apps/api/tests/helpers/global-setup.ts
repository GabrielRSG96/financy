import { execFileSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const templatePath = resolve(apiRoot, 'prisma/test-template.db')

export async function setup() {
  rmSync(templatePath, { force: true })

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: `file:${templatePath}` },
    stdio: 'pipe',
  })
}

export async function teardown() {
  if (existsSync(templatePath)) rmSync(templatePath, { force: true })
}
