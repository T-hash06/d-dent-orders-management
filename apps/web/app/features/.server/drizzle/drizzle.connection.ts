import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';

config({
	path: '.env',
	override: true,
});

config({
	path: '.env.local',
	override: true,
});

if (!process.env.DB_URL) {
	throw new Error('DB_URL environment variable is not defined');
}

export const db = drizzle(process.env.DB_URL);
