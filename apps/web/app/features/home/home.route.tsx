import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@full-stack-template/ui';
import { Computer, Logout01Icon, Moon, Sun } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '@/features/auth/auth.context';
import { signOut } from '@/features/auth/auth.lib';
import { m } from '@/features/i18n/paraglide/messages';
import { localizeHref } from '@/features/i18n/paraglide/runtime';
import type { Route } from './+types/home.route';

export const meta = ({ location: _location }: Route.MetaArgs) => [
	{ title: 'Home' },
	{ name: 'description', content: 'Welcome to the home page!' },
];

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return m.greetingMorning();
	if (hour < 18) return m.greetingAfternoon();
	return m.greetingEvening();
}

function getUserInitials(name?: string | null) {
	if (!name) return '?';
	return name
		.split(' ')
		.slice(0, 2)
		.map((n) => n[0])
		.join('')
		.toUpperCase();
}

export default function HomeRoute() {
	const { theme, setTheme } = useTheme();
	const navigate = useNavigate();
	const session = useSession();

	const handleSignOut = useCallback(async () => {
		await signOut();
		navigate(localizeHref('/auth/login'));
	}, [navigate]);

	const userName = session.user.name;
	const userEmail = session.user.email;
	const userImage = session.user.image;

	return (
		<div className="min-h-dvh w-dvw max-w-full bg-background overflow-x-hidden">
			<header className="z-10 sticky top-0 border-b border-border bg-background/80 backdrop-blur-md">
				<div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="w-7 h-7 rounded-xl bg-primary shadow-sm flex items-center justify-center shrink-0">
							<span className="text-primary-foreground font-bold text-sm leading-none">
								D
							</span>
						</div>
						<span className="text-sm font-semibold tracking-tight">d-dent</span>
					</div>

					<div className="flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button variant="ghost" size="icon" className="size-8" />
								}
							>
								<HugeiconsIcon
									icon={
										theme === 'system'
											? Computer
											: theme === 'light'
												? Sun
												: Moon
									}
									className="h-4 w-4"
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuGroup>
									<DropdownMenuLabel>{m.selectTheme()}</DropdownMenuLabel>
									<DropdownMenuRadioGroup
										value={theme}
										onValueChange={setTheme}
									>
										<DropdownMenuRadioItem value="system">
											<HugeiconsIcon
												icon={Computer}
												className="mr-2 h-4 w-4 opacity-70"
											/>
											{m.themeSystem()}
										</DropdownMenuRadioItem>
										<DropdownMenuRadioItem value="light">
											<HugeiconsIcon
												icon={Sun}
												className="mr-2 h-4 w-4 opacity-70"
											/>
											{m.themeLight()}
										</DropdownMenuRadioItem>
										<DropdownMenuRadioItem value="dark">
											<HugeiconsIcon
												icon={Moon}
												className="mr-2 h-4 w-4 opacity-70"
											/>
											{m.themeDark()}
										</DropdownMenuRadioItem>
									</DropdownMenuRadioGroup>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>

						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<button
										type="button"
										className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
										aria-label="User menu"
									/>
								}
							>
								<Avatar className="size-8 ring-2 ring-border hover:ring-primary/40 transition-all duration-200">
									{userImage ? (
										<AvatarImage src={userImage} alt={userName ?? ''} />
									) : null}
									<AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
										{getUserInitials(userName)}
									</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-52">
								<div className="px-3 py-2.5">
									<p className="text-sm font-medium leading-none truncate">
										{userName ?? '—'}
									</p>
									<p className="text-xs text-muted-foreground mt-1 truncate">
										{userEmail ?? '—'}
									</p>
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive hover:text-background focus:text-background cursor-pointer"
									onClick={handleSignOut}
								>
									<HugeiconsIcon icon={Logout01Icon} className="mr-2 h-4 w-4" />
									{m.signOut()}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>

			<main className="relative z-10 mx-auto max-w-3xl px-6 py-10 space-y-8">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold tracking-tight">
						{getGreeting()},{' '}
						<span className="text-primary">
							{userName?.split(' ')[0] ?? m.greetingFallback()}
						</span>
						.
					</h1>
					<p className="text-muted-foreground text-sm">
						Panel inicial del sistema de gestión de pedidos.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Order Management</CardTitle>
						<CardDescription>
							Se eliminó el módulo de tareas y ahora la aplicación usará órdenes
							como entidad principal.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Backend listo para exponer schemas, queries y mutations de
							pedidos.
						</p>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
