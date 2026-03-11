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
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from '@d-dentaditamentos/ui';
import { Plus } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type SubmitEvent, useCallback, useState } from 'react';
import { m } from '@/features/i18n/paraglide/messages';
import { useTRPC } from '@/features/trpc/trpc.context';
import {
	CREATE_USER_FORM_OPTIONS,
	useAppForm,
} from '@/features/users/forms/create-user.form';

export function CreateUserDialog() {
	const [open, setOpen] = useState(false);
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const createMutation = useMutation(
		trpc.users.createUser.mutationOptions({
			onError: () => {
				toast.error(m.createUserFailed());
			},
			onSuccess: () => {
				toast.success(m.createUserSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.users.getUsers.queryKey(),
				});
				form.reset();
				setOpen(false);
			},
		}),
	);

	const form = useAppForm({
		...CREATE_USER_FORM_OPTIONS,
		onSubmit: async ({ value }) => {
			createMutation.mutate({
				name: value.name,
				email: value.email,
				password: value.password,
				role: value.role,
			});
		},
	});

	const handleSubmit = useCallback(
		async (event: SubmitEvent) => {
			event.preventDefault();
			await form.handleSubmit();
		},
		[form],
	);

	const isLoading = createMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button size="sm" className="gap-2 h-8 px-3">
						<HugeiconsIcon icon={Plus} className="h-4 w-4" />
						<span className="hidden sm:inline">{m.createUserButton()}</span>
						<span className="sm:hidden">{m.createUserButtonShort()}</span>
					</Button>
				}
			/>

			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-md">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.createUserTitle()}</DialogTitle>
					<DialogDescription>{m.createUserDescription()}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<FieldGroup>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>{m.userName()}</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={m.userNamePlaceholder()}
											aria-invalid={isInvalid}
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											onBlur={() => field.handleBlur()}
											disabled={isLoading}
											autoFocus
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="email">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.userEmail()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											placeholder={m.userEmailPlaceholder()}
											aria-invalid={isInvalid}
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											onBlur={() => field.handleBlur()}
											disabled={isLoading}
											autoComplete="email"
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="password">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{m.passwordLabel()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											placeholder={m.userPasswordPlaceholder()}
											aria-invalid={isInvalid}
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											onBlur={() => field.handleBlur()}
											disabled={isLoading}
											autoComplete="new-password"
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="role">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>{m.userRole()}</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) => {
												if (value) {
													field.handleChange(value);
												}
											}}
											itemToStringLabel={(item) => {
												switch (item) {
													case 'admin':
														return m.userRoleAdmin();
													case 'operator':
														return m.userRoleOperator();
													case 'supervisor':
														return m.userRoleSupervisor();
													case 'accounting':
														return m.userRoleAccounting();
													default:
														return item;
												}
											}}
										>
											<SelectTrigger
												id={field.name}
												aria-invalid={isInvalid}
												disabled={isLoading}
											>
												<SelectValue placeholder={m.userRolePlaceholder()} />
											</SelectTrigger>
											<SelectContent alignItemWithTrigger={false}>
												<SelectGroup>
													<SelectItem value="admin">
														{m.userRoleAdmin()}
													</SelectItem>
													<SelectItem value="operator">
														{m.userRoleOperator()}
													</SelectItem>
													<SelectItem value="supervisor">
														{m.userRoleSupervisor()}
													</SelectItem>
													<SelectItem value="accounting">
														{m.userRoleAccounting()}
													</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>

					<DialogFooter className="gap-4">
						<DialogClose
							render={
								<Button type="button" variant="outline" disabled={isLoading}>
									{m.cancelButton()}
								</Button>
							}
						/>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									{m.creatingButton()}
								</>
							) : (
								m.createButton()
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
