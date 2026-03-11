import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from '@d-dentaditamentos/ui';
import {
	CaduceusIcon,
	Computer,
	CustomerServiceIcon,
	DashboardSquare01Icon,
	Moon,
	PackageDeliveredIcon,
	PackageIcon,
	Sun,
	UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { Link, Outlet, redirect, useLocation } from 'react-router';
import {
	EMPTY_PERMISSIONS,
	getPermissionsByRole,
	type Permissions,
} from '@/features/.server/auth/better-auth-roles.constant';
import {
	auth,
	type Session,
} from '@/features/.server/auth/better-auth-server.lib';
import {
	SessionProvider,
	useSession,
} from '@/features/better-auth/better-auth.context';
import { signOut } from '@/features/better-auth/better-auth-client.lib';
import { m } from '@/features/i18n/paraglide/messages';
import {
	getLocale,
	localizeHref,
	setLocale,
} from '@/features/i18n/paraglide/runtime';
import { useTRPC } from '@/features/trpc/trpc.context';
import type { Route } from './+types/home.layout';

export const loader = async ({ request }: Route.LoaderArgs) => {
	let session: Session | null = null;
	let permissions: Permissions = EMPTY_PERMISSIONS;

	try {
		session = await auth.api.getSession({
			headers: request.headers,
		});
		permissions = getPermissionsByRole(session?.user.role);
	} catch (error) {
		console.error('Error fetching session:', error);
		throw error;
	}

	if (!session) {
		throw redirect(localizeHref('/auth/login'));
	}

	return { ...session, permissions };
};

function UserMenu({ session }: { session: Session }) {
	const { theme, setTheme } = useTheme();
	const userName = session.user.name ?? m.greetingFallback();
	const userInitials = userName
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<SidebarMenuButton size="lg" className="transition-colors" />}
			>
				<Avatar className="h-8 w-8 rounded-md">
					<AvatarImage src={session.user.image ?? ''} alt={userName} />
					<AvatarFallback className="rounded-md">
						{userInitials || 'U'}
					</AvatarFallback>
				</Avatar>
				<div className="grid flex-1 text-left text-sm leading-tight">
					<span className="truncate font-medium">{userName}</span>
					<span className="truncate text-xs text-sidebar-foreground/70">
						{session.user.email}
					</span>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel>{m.selectTheme()}</DropdownMenuLabel>
					<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
						<DropdownMenuRadioItem value="system">
							<HugeiconsIcon icon={Computer} className="mr-2 h-4 w-4" />
							{m.themeSystem()}
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="light">
							<HugeiconsIcon icon={Sun} className="mr-2 h-4 w-4" />
							{m.themeLight()}
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="dark">
							<HugeiconsIcon icon={Moon} className="mr-2 h-4 w-4" />
							{m.themeDark()}
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<DropdownMenuLabel>{m.selectLanguage()}</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={getLocale()}
						onValueChange={(locale) => setLocale(locale)}
					>
						<DropdownMenuRadioItem value="en">
							{m.languageEnglish()}
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="es">
							{m.languageSpanish()}
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start"
					onClick={async () => {
						await signOut();
						window.location.href = localizeHref('/auth/login');
					}}
				>
					{m.signOut()}
				</Button>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function HomeSidebar() {
	const location = useLocation();
	const session = useSession();
	const normalizedPath =
		location.pathname.replace(/^\/(en|es)(?=\/|$)/, '') || '/';
	const isProducts = normalizedPath.startsWith('/products');
	const isOrders = normalizedPath.startsWith('/orders');
	const isCustomers = normalizedPath.startsWith('/customers');
	const isUsers = normalizedPath.startsWith('/users');
	const isHome = !isProducts && !isOrders && !isCustomers && !isUsers;

	const trpc = useTRPC();
	const { data: homeOverview } = useQuery(
		trpc.orders.getHomeOverview.queryOptions(),
	);

	return (
		<>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" isActive>
							<div className="size-8 rounded-md min-w-8 bg-sidebar-primary/75 text-background flex items-center justify-center">
								<HugeiconsIcon icon={CaduceusIcon} className="size-4" />
							</div>
							<div className="grid flex-1 text-left leading-tight">
								<span className="truncate font-semibold text-sm tracking-tight">
									{m.sidePanelAppName()}
								</span>
								<span className="truncate text-xs text-sidebar-foreground/70 tracking-wide">
									{m.navigationGroupLabel()}
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>{m.navigationGroupLabel()}</SidebarGroupLabel>
					<SidebarMenu className="gap-1">
						<SidebarMenuItem>
							<SidebarMenuButton
								render={<Link to={localizeHref('/')} />}
								className="transition-colors"
								isActive={isHome}
								tooltip={m.navHome()}
								nativeButton={false}
							>
								<HugeiconsIcon
									icon={DashboardSquare01Icon}
									className="size-4"
								/>
								<span>{m.navHome()}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>

						{session.permissions.products.includes('list') && (
							<SidebarMenuItem>
								<SidebarMenuButton
									render={<Link to={localizeHref('/products')} />}
									className="transition-colors"
									isActive={isProducts}
									tooltip={m.navProducts()}
									nativeButton={false}
								>
									<HugeiconsIcon icon={PackageIcon} className="size-4" />
									<span>{m.navProducts()}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)}

						{session.permissions.orders.includes('list') && (
							<SidebarMenuItem>
								<SidebarMenuButton
									render={<Link to={localizeHref('/orders')} />}
									className="transition-colors"
									isActive={isOrders}
									tooltip={m.navOrders()}
									nativeButton={false}
								>
									<HugeiconsIcon
										icon={PackageDeliveredIcon}
										className="size-4"
									/>
									<span>{m.navOrders()}</span>
								</SidebarMenuButton>
								{(homeOverview?.stats.myPendingOrders ?? 0) > 0 ? (
									<SidebarMenuBadge>
										{homeOverview?.stats.myPendingOrders}
									</SidebarMenuBadge>
								) : null}
							</SidebarMenuItem>
						)}

						{session.permissions.customers.includes('list') && (
							<SidebarMenuItem>
								<SidebarMenuButton
									render={<Link to={localizeHref('/customers')} />}
									className="transition-colors"
									isActive={isCustomers}
									tooltip={m.navCustomers()}
								>
									<HugeiconsIcon
										icon={CustomerServiceIcon}
										className="size-4"
									/>
									<span>{m.navCustomers()}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)}

						{session.permissions.user.includes('list') && (
							<SidebarMenuItem>
								<SidebarMenuButton
									render={<Link to={localizeHref('/users')} />}
									className="transition-colors"
									isActive={isUsers}
									tooltip={m.navUsers()}
									nativeButton={false}
								>
									<HugeiconsIcon icon={UserGroupIcon} className="size-4" />
									<span>{m.navUsers()}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarSeparator />
				<SidebarMenu>
					<SidebarMenuItem>
						<UserMenu session={session} />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</>
	);
}

function HomeInset() {
	const location = useLocation();
	const normalizedPath =
		location.pathname.replace(/^\/(en|es)(?=\/|$)/, '') || '/';
	const isProducts = normalizedPath.startsWith('/products');
	const isOrders = normalizedPath.startsWith('/orders');
	const isCustomers = normalizedPath.startsWith('/customers');
	const isUsers = normalizedPath.startsWith('/users');

	const headerTitle = isProducts
		? m.productsTitle()
		: isOrders
			? m.ordersTitle()
			: isCustomers
				? m.customersTitle()
				: isUsers
					? m.usersTitle()
					: m.homePageTitle();

	const headerDescription = isProducts
		? m.productsDescription()
		: isOrders
			? m.ordersDescription()
			: isCustomers
				? m.customersDescription()
				: isUsers
					? m.usersDescription()
					: m.homePageDescription();

	return (
		<SidebarInset>
			<header className="h-14 rounded-t-full border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70 sticky top-0 z-20">
				<div className="h-full px-4 md:px-6 flex items-center gap-3">
					<SidebarTrigger className="-ml-1" />
					<div className="min-w-0">
						<p className="font-semibold truncate">{headerTitle}</p>
						<p className="text-xs text-muted-foreground truncate hidden sm:block">
							{headerDescription}
						</p>
					</div>
				</div>
			</header>
			<Outlet />
		</SidebarInset>
	);
}

export default function HomeLayout({ loaderData }: Route.ComponentProps) {
	const session = loaderData;

	return (
		<SessionProvider value={session}>
			<SidebarProvider>
				<Sidebar variant="inset" collapsible="icon">
					<HomeSidebar />
					<SidebarRail />
				</Sidebar>

				<HomeInset />
			</SidebarProvider>
		</SessionProvider>
	);
}
