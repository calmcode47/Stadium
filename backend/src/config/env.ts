import path from 'node:path'
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_FILE: z.string().min(1).default('./data/stadium.db'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('1h'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().optional().default(''),
  ENABLE_SIMULATOR: z
    .string()
    .optional()
    .default('true')
    .transform(value => value === 'true')
})

export type Env = z.infer<typeof schema>

let cachedEnv: Env | null = null

export const getEnv = (): Env => {
  if (cachedEnv) return cachedEnv
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const message = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid environment configuration: ${message}`)
  }

  cachedEnv = {
    ...parsed.data,
    DATABASE_FILE: path.resolve(process.cwd(), parsed.data.DATABASE_FILE)
  }
  return cachedEnv
}

export const resetEnvForTests = (): void => {
  cachedEnv = null
}
