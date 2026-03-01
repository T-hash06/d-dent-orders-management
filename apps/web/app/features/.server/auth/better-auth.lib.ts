import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as authSchema from '@/features/.server/auth/auth.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
	},
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: authSchema,
		usePlural: true,
	}),
});

export type Session = typeof auth.$Infer.Session;
