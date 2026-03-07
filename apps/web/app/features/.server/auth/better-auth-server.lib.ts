import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin as adminPlugin } from 'better-auth/plugins';
import * as authSchema from '@/features/.server/auth/better-auth.schema';
import {
	ac,
	admin,
	operator,
	supervisor,
} from '@/features/.server/auth/better-auth-roles.constant';
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
	plugins: [
		adminPlugin({
			ac: ac,
			roles: {
				admin,
				operator,
				supervisor,
			},
		}),
	],
});

export type Session = typeof auth.$Infer.Session;
