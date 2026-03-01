import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	Textarea,
	toast,
} from '@full-stack-template/ui';
import { Plus } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type SubmitEvent, useCallback, useState } from 'react';
import type { Todo } from '@/features/.server/todos/todo.schema';
import { m } from '@/features/i18n/paraglide/messages';
import {
	CREATE_TODO_FORM_OPTIONS,
	useAppForm,
} from '@/features/todos/create-todo.form';
import { useTRPC } from '@/features/trpc/trpc.context';

export function CreateTodoDialog() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const createTodoMutation = useMutation(
		trpc.todos.createTodo.mutationOptions({
			onMutate: async (variables: { title: string; description?: string }) => {
				// Cancel any outgoing refetches
				await queryClient.cancelQueries({
					queryKey: trpc.todos.getTodos.queryKey(),
				});

				// Snapshot the previous value
				const previousTodos = queryClient.getQueryData(
					trpc.todos.getTodos.queryKey(),
				);

				// Optimistically update to the new value
				queryClient.setQueryData(
					trpc.todos.getTodos.queryKey(),
					(old: Todo[] | undefined) => [
						...(old || []),
						{
							id: `temp-${Date.now()}`,
							title: variables.title,
							description: variables.description || '',
							completed: false,
							userId: 'temp',
						} satisfies Todo,
					],
				);

				return { previousTodos };
			},
			onError: (error, _variables, context) => {
				// Rollback on error
				if (context?.previousTodos) {
					queryClient.setQueryData(
						trpc.todos.getTodos.queryKey(),
						context.previousTodos,
					);
				}
				createTodoForm.setErrorMap({
					onSubmit: {
						fields: error.data?.zodError ?? {},
					},
				});
				toast.error(m.createTodoFailed());
			},
			onSuccess: () => {
				toast.success(m.createTodoSuccess());
				// Refetch to ensure data is in sync
				queryClient.invalidateQueries({
					queryKey: trpc.todos.getTodos.queryKey(),
				});
				createTodoForm.reset();
				setDialogOpen(false);
			},
		}),
	);

	// Form with state-colocation - form state stays local to avoid unnecessary parent renders
	const createTodoForm = useAppForm({
		...CREATE_TODO_FORM_OPTIONS,
		onSubmit: async ({ value }) => {
			const { title, description } = value;

			createTodoMutation.mutate({
				title,
				description: description || undefined,
			});
		},
	});

	const handleSubmit = useCallback(
		async (event: SubmitEvent) => {
			event.preventDefault();
			await createTodoForm.handleSubmit();
		},
		[createTodoForm],
	);

	const isLoading = createTodoMutation.isPending;

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
			<DialogTrigger
				render={
					<Button
						size="sm"
						className="gap-2 h-8 px-3 transition-all duration-200 hover:shadow-md"
					>
						<HugeiconsIcon icon={Plus} className="h-4 w-4" />
						<span className="hidden sm:inline">{m.createTaskButton()}</span>
						<span className="sm:hidden">{m.createTaskButtonShort()}</span>
					</Button>
				}
			/>

			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-md">
				<DialogHeader className="gap-1">
					<DialogTitle className="text-lg sm:text-base">
						{m.createTaskTitle()}
					</DialogTitle>
					<DialogDescription>{m.createTaskDescription()}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<FieldGroup className="space-y-3">
						<createTodoForm.Field name="title">
							{(titleField) => {
								const isInvalid =
									titleField.state.meta.isTouched &&
									!titleField.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={titleField.name}>
											{m.taskTitleLabel()}
										</FieldLabel>
										<Input
											id={titleField.name}
											name={titleField.name}
											placeholder={m.taskTitlePlaceholder()}
											aria-invalid={isInvalid}
											value={titleField.state.value}
											onChange={(event) =>
												titleField.handleChange(event.target.value)
											}
											onBlur={() => titleField.handleBlur()}
											disabled={isLoading}
											autoFocus
											className="transition-colors duration-150"
										/>
										<FieldError errors={titleField.state.meta.errors} />
									</Field>
								);
							}}
						</createTodoForm.Field>

						<createTodoForm.Field name="description">
							{(descriptionField) => {
								const isInvalid =
									descriptionField.state.meta.isTouched &&
									!descriptionField.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={descriptionField.name}>
											{m.taskDescriptionLabel()}
											<span className="text-muted-foreground font-normal ml-1">
												({m.optional()})
											</span>
										</FieldLabel>
										<Textarea
											id={descriptionField.name}
											name={descriptionField.name}
											placeholder={m.taskDescriptionPlaceholder()}
											aria-invalid={isInvalid}
											value={descriptionField.state.value}
											onChange={(event) =>
												descriptionField.handleChange(event.target.value)
											}
											onBlur={() => descriptionField.handleBlur()}
											disabled={isLoading}
											rows={3}
											className="resize-none transition-colors duration-150"
										/>
										<FieldError errors={descriptionField.state.meta.errors} />
									</Field>
								);
							}}
						</createTodoForm.Field>
					</FieldGroup>

					<DialogFooter className="gap-2 pt-2">
						<DialogClose
							render={
								<Button
									type="button"
									variant="outline"
									disabled={isLoading}
									className="transition-all duration-200"
								>
									{m.cancelButton()}
								</Button>
							}
						/>
						<Button
							type="submit"
							disabled={isLoading}
							className="transition-all duration-200 hover:shadow-md disabled:opacity-50"
						>
							{isLoading ? (
								<>
									<span className="inline-block animate-spin mr-2">⏳</span>
									{m.savingButton()}
								</>
							) : (
								m.saveButton()
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
