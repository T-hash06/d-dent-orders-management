import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
	path: '.env',
	override: true,
});

config({
	path: '.env.local',
	override: true,
});

if (!process.env.DB_URL) {
	throw new Error('DB_URL environment variable is not set');
}

export default defineConfig({
	out: './.drizzle',
	schema: 'app/features/.server/**/*.schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: process.env.DB_URL,
	},
});
