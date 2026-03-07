import { createContext, useContext } from 'react';
import type { Permissions } from '@/features/.server/auth/better-auth-roles.constant';
import type { Session } from '@/features/.server/auth/better-auth-server.lib';

export type SessionContextType =
	| {
			user: Session['user'];
			session: Session['session'];
			permissions: Permissions;
	  }
	| undefined;

const SessionContext = createContext<SessionContextType>(undefined);

export const useSession = () => {
	const session = useContext(SessionContext);

	if (session === undefined) {
		throw new Error('useSession must be used within a SessionProvider');
	}

	return session;
};

export const SessionProvider = SessionContext.Provider;
