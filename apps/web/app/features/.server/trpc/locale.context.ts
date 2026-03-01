import { AsyncLocalStorage } from 'node:async_hooks';
import type { getLocale } from '@/features/i18n/paraglide/runtime';

export type LocaleContext = ReturnType<typeof getLocale>;

export const localeContextStorage = new AsyncLocalStorage<LocaleContext>();

export const getLocaleFromAsyncStorage = () =>
	localeContextStorage.getStore() ?? 'en';
