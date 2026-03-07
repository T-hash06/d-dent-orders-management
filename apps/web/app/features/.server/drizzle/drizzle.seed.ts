import { config } from 'dotenv';
import { auth } from '@/features/.server/auth/better-auth-server.lib';

config();

async function seed() {
	console.log('Starting database seeding...');

	const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
	const ADMIN_NAME = process.env.ADMIN_NAME;
	const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

	if (!ADMIN_EMAIL) {
		throw new Error('ADMIN_EMAIL environment variable is not set');
	}
	if (!ADMIN_NAME) {
		throw new Error('ADMIN_NAME environment variable is not set');
	}
	if (!ADMIN_PASSWORD) {
		throw new Error('ADMIN_PASSWORD environment variable is not set');
	}

	await auth.api.createUser({
		body: {
			email: ADMIN_EMAIL,
			name: ADMIN_NAME,
			password: ADMIN_PASSWORD,
			role: 'admin',
		},
	});
}

seed();
