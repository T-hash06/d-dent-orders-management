import {
	Badge,
	Button,
	ScrollArea,
	Separator,
	Toaster,
	TooltipProvider,
} from '@d-dentaditamentos/ui';
import { Alert01Icon, SearchRemoveIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { ThemeProvider } from 'next-themes';
import { useCallback, useState } from 'react';
import {
	isRouteErrorResponse,
	Links,
	Meta,
	type MiddlewareFunction,
	Outlet,
	Scripts,
	ScrollRestoration,
} from 'react-router';
import { m } from '@/features/i18n/paraglide/messages';
import { paraglideMiddleware } from '@/features/i18n/paraglide/server';
import { TrpcQueryClientProvider } from '@/features/trpc/trpc.provider';
import type { Route } from './+types/root';

import './app.css';

export const links: Route.LinksFunction = () => [];

export const middleware: MiddlewareFunction[] = [
	(ctx, next) => paraglideMiddleware(ctx.request, () => next()),
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<Toaster position="bottom-right" />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<ThemeProvider attribute="class" storageKey="theme" enableSystem>
			<TrpcQueryClientProvider>
				<TooltipProvider>
					<Outlet />
				</TooltipProvider>
			</TrpcQueryClientProvider>
		</ThemeProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	const [copied, setCopied] = useState(false);

	const is404 = isRouteErrorResponse(error) && error.status === 404;
	const isHttpError = isRouteErrorResponse(error);
	const statusCode = isHttpError ? error.status : undefined;
	const isDev = import.meta.env.DEV;
	const jsError =
		!isRouteErrorResponse(error) && error instanceof Error ? error : undefined;

	const title = is404 ? m.error404Title() : m.errorTitle();
	const description = is404
		? m.error404Description()
		: isHttpError
			? m.errorHttpDescription()
			: m.errorDescription();

	const handleCopyStack = useCallback(async () => {
		if (!jsError?.stack) return;
		await navigator.clipboard.writeText(jsError.stack);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [jsError?.stack]);

	return (
		<div className="min-h-dvh w-dvw max-w-full bg-background overflow-x-hidden flex flex-col">
			<div
				className="fixed inset-0 pointer-events-none select-none overflow-hidden"
				aria-hidden
			>
				<div className="absolute -top-40 -left-40 w-md h-112 rounded-full bg-primary/5" />
				<div className="absolute -bottom-24 right-1/4 w-80 h-80 rounded-full bg-destructive/4" />
				<div className="absolute top-1/2 -right-32 w-64 h-64 rounded-full bg-accent/8" />
			</div>

			<header className="relative z-10 px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
				<div className="mx-auto max-w-3xl flex items-center">
					<div className="flex items-center gap-2.5">
						<div className="w-7 h-7 rounded-xl bg-primary shadow-sm flex items-center justify-center shrink-0">
							<span className="text-primary-foreground font-bold text-sm leading-none">
								A
							</span>
						</div>
						<span className="text-sm font-semibold tracking-tight">
							{m.sidePanelAppName()}
						</span>
					</div>
				</div>
			</header>

			<main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
				<div className="w-full max-w-md space-y-8 text-center">
					<div className="flex justify-center">
						<div className="size-20 rounded-3xl bg-muted/60 border border-border shadow-sm flex items-center justify-center">
							{is404 ? (
								<HugeiconsIcon
									icon={SearchRemoveIcon}
									className="h-9 w-9 text-muted-foreground/60"
									aria-hidden="true"
								/>
							) : (
								<HugeiconsIcon
									icon={Alert01Icon}
									className="h-9 w-9 text-destructive/70"
									aria-hidden="true"
								/>
							)}
						</div>
					</div>

					<div className="space-y-4">
						{statusCode !== undefined && (
							<div className="flex justify-center">
								<Badge
									variant={is404 ? 'secondary' : 'destructive'}
									className="font-mono text-xs tracking-wide"
								>
									{m.errorStatusCode({ code: String(statusCode) })}
								</Badge>
							</div>
						)}
						<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
						<p className="text-muted-foreground leading-relaxed text-sm max-w-sm mx-auto">
							{description}
						</p>
					</div>

					{isDev && jsError && (
						<div className="text-left rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
							<p className="text-xs font-mono text-destructive break-all leading-relaxed">
								{jsError.message}
							</p>
						</div>
					)}

					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<Button
							size="lg"
							className="w-full sm:w-auto"
							onClick={() => {
								window.location.href = '/';
							}}
						>
							{m.errorGoHome()}
						</Button>
						<Button
							variant="outline"
							size="lg"
							className="w-full sm:w-auto"
							onClick={() => window.location.reload()}
						>
							{m.errorReload()}
						</Button>
					</div>

					{isDev && jsError?.stack && (
						<div className="text-left space-y-3">
							<Separator />
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
									{m.errorStackTitle()}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCopyStack}
									className="text-xs h-7"
								>
									{copied ? m.errorCopied() : m.errorCopyStack()}
								</Button>
							</div>
							<ScrollArea className="h-48 rounded-xl border border-border bg-muted/30">
								<pre className="p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
									{jsError.stack}
								</pre>
							</ScrollArea>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
