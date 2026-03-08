import { TRPCError } from '@trpc/server';

export function assertAuthApiSuccess({
	result,
	fallbackMessage,
}: {
	result: unknown;
	fallbackMessage: string;
}): void {
	if (hasAuthApiError(result)) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: fallbackMessage,
		});
	}
}

function hasAuthApiError(result: unknown): result is { error: unknown } {
	if (typeof result !== 'object' || result === null) {
		return false;
	}

	return 'error' in result && result.error !== null;
}
