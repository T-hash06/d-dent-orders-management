import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Badge,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Progress,
	ScrollArea,
	Skeleton,
} from '@full-stack-template/ui';
import {
	CheckListIcon,
	Computer,
	Logout01Icon,
	Moon,
	Sun,
	Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '@/features/auth/auth.context';
import { signOut } from '@/features/auth/auth.lib';
import { m } from '@/features/i18n/paraglide/messages';
import { localizeHref } from '@/features/i18n/paraglide/runtime';
import { CreateTodoDialog } from '@/features/todos/create-todo-dialog';
import { useTRPC } from '@/features/trpc/trpc.context';
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
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const todosQuery = useQuery(trpc.todos.getTodos.queryOptions());
	const session = useSession();

	useSubscription(
		trpc.todos.onToggleTodo.subscriptionOptions(undefined, {
			onData: (_data) => {
				todosQuery.refetch();
			},
		}),
	);

	const toggleTodoMutation = useMutation(
		trpc.todos.toggleTodo.mutationOptions({
			onMutate: async ({ id }) => {
				await queryClient.cancelQueries({
					queryKey: trpc.todos.getTodos.queryKey(),
				});

				const previousTodos = queryClient.getQueryData(
					trpc.todos.getTodos.queryKey(),
				);

				queryClient.setQueryData(trpc.todos.getTodos.queryKey(), (old) => {
					return old?.map((todo) =>
						todo.id === id ? { ...todo, completed: !todo.completed } : todo,
					);
				});

				return { previousTodos };
			},

			onError: (_error, _newTodoId, context) => {
				queryClient.setQueryData(
					trpc.todos.getTodos.queryKey(),
					context?.previousTodos,
				);
			},
		}),
	);

	const handleToggleTodo = useCallback(
		(id: string) => {
			toggleTodoMutation.mutate({ id });
		},
		[toggleTodoMutation.mutate],
	);

	const handleSignOut = useCallback(async () => {
		await signOut();
		navigate(localizeHref('/auth/login'));
	}, [navigate]);

	const todos = todosQuery.data ?? [];
	const completedCount = todos.filter((todoItem) => todoItem.completed).length;
	const totalCount = todos.length;
	const progressPercent =
		totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
	const allDone = totalCount > 0 && completedCount === totalCount;

	const userName = session.user.name;
	const userEmail = session.user.email;
	const userImage = session.user.image;

	return (
		<div className="min-h-dvh w-dvw max-w-full bg-background overflow-x-hidden">
			<div
				className="fixed inset-0 pointer-events-none select-none overflow-hidden"
				aria-hidden
			>
				<div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/6" />
				<div className="absolute top-1/3 -left-24 w-64 h-64 rounded-full bg-accent/10" />
				<div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-primary/4" />
			</div>

			<header className="z-10 sticky top-0 border-b border-border bg-background/80 backdrop-blur-md">
				<div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
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
						{allDone
							? m.allTasksComplete()
							: totalCount === 0
								? m.noTasksYetInline()
								: totalCount - completedCount === 1
									? m.taskRemainingOne()
									: m.taskRemainingOther({
											count: totalCount - completedCount,
										})}
					</p>
				</div>

				{!todosQuery.isLoading && totalCount > 0 && (
					<div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">{m.taskProgress()}</p>
							{allDone ? (
								<Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-medium">
									{m.allDoneBadge()}
								</Badge>
							) : (
								<span className="text-xs text-muted-foreground tabular-nums">
									{completedCount} / {totalCount}
								</span>
							)}
						</div>
						<Progress value={progressPercent} className="h-2" />
					</div>
				)}

				<div className="space-y-2">
					<div className="flex items-center justify-between px-1 mb-3">
						<h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
							{m.tasksSectionTitle()}
						</h2>
						<div className="flex items-center gap-2">
							{toggleTodoMutation.isPending && (
								<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<span className="size-1.5 rounded-full bg-primary animate-pulse" />
									{m.syncing()}
								</span>
							)}
							<CreateTodoDialog />
						</div>
					</div>

					{todosQuery.isLoading ? (
						<div className="space-y-2">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card"
								>
									<Skeleton className="size-5 rounded-full shrink-0" />
									<Skeleton className="h-4 flex-1 max-w-48 rounded-md" />
								</div>
							))}
						</div>
					) : todos.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<div className="size-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mb-4">
								<HugeiconsIcon
									icon={CheckListIcon}
									className="h-6 w-6 text-muted-foreground/60"
									aria-hidden="true"
								/>
							</div>
							<p className="text-sm font-medium">{m.noTasksEmptyTitle()}</p>
							<p className="text-xs text-muted-foreground mt-1">
								{m.allCaughtUpEmpty()}
							</p>
						</div>
					) : (
						<ScrollArea className="max-h-120">
							<ul className="space-y-1.5 pr-1">
								{todos
									.slice()
									.sort((a, b) => Number(a.completed) - Number(b.completed))
									.map((todo) => (
										<li key={todo.id}>
											<button
												type="button"
												onClick={() => handleToggleTodo(todo.id)}
												disabled={toggleTodoMutation.isPending}
												className="group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-border transition-all duration-150 text-left disabled:opacity-60"
											>
												<span
													className={[
														'size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200',
														todo.completed
															? 'bg-primary border-primary'
															: 'border-border group-hover:border-primary/50',
													].join(' ')}
												>
													{todo.completed && (
														<HugeiconsIcon
															icon={Tick02Icon}
															className="h-3 w-3 text-primary-foreground"
															aria-hidden="true"
														/>
													)}
												</span>
												<span
													className={[
														'text-sm font-medium flex-1 transition-all duration-200',
														todo.completed
															? 'line-through text-muted-foreground'
															: 'text-foreground',
													].join(' ')}
												>
													{todo.title}
												</span>
												{todo.completed && (
													<span className="text-xs text-muted-foreground/60 shrink-0">
														{m.todoDoneLabel()}
													</span>
												)}
											</button>
										</li>
									))}
							</ul>
						</ScrollArea>
					)}
				</div>
			</main>
		</div>
	);
}
