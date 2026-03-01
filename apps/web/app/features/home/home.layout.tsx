import type { Route } from '.react-router/types/app/features/home/+types/home.layout';
import { Outlet, redirect } from 'react-router';
import { auth, type Session } from '@/features/.server/auth/better-auth.lib';
import { SessionProvider } from '@/features/auth/auth.context';
import { localizeHref } from '@/features/i18n/paraglide/runtime';

export const loader = async ({
	request,
}: Route.LoaderArgs): Promise<Session> => {
	let session: Session | null = null;
	try {
		session = await auth.api.getSession({
			headers: request.headers,
		});
	} catch (error) {
		console.error('Error fetching session:', error);
		throw error;
	}

	if (!session) {
		throw redirect(localizeHref('/auth/login'));
	}

	return session;
};

export default function HomeLayout({ loaderData }: Route.ComponentProps) {
	const session = loaderData;

	return (
		<SessionProvider value={session}>
			<Outlet />
		</SessionProvider>
	);
}
