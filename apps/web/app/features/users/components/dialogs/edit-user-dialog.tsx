import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	Spinner,
	toast,
} from '@d-dentaditamentos/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type SubmitEvent, useCallback, useEffect } from 'react';
import type { User } from '@/features/.server/users/user.types';
import { m } from '@/features/i18n/paraglide/messages';
import { useTRPC } from '@/features/trpc/trpc.context';
import {
	editUserFormOptions,
	useAppForm,
} from '@/features/users/forms/edit-user.form';

type EditUserDialogProps = {
	user: User | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditUserDialog({
	user,
	open,
	onOpenChange,
}: EditUserDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const updateMutation = useMutation(
		trpc.users.updateUser.mutationOptions({
			onError: () => {
				toast.error(m.editUserFailed());
			},
			onSuccess: () => {
				toast.success(m.editUserSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.users.getUsers.queryKey(),
				});
				onOpenChange(false);
			},
		}),
	);

	const form = useAppForm({
		...editUserFormOptions({
			name: user?.name ?? '',
		}),
		onSubmit: async ({ value }) => {
			if (!user) {
				return;
			}

			updateMutation.mutate({
				userId: user.id,
				name: value.name,
			});
		},
	});

	useEffect(() => {
		if (user) {
			form.reset({
				name: user.name,
			});
		}
	}, [user, form]);

	const handleSubmit = useCallback(
		async (event: SubmitEvent) => {
			event.preventDefault();
			await form.handleSubmit();
		},
		[form],
	);

	const isLoading = updateMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-dvh overflow-y-auto sm:max-w-md">
				<DialogHeader className="gap-1">
					<DialogTitle>{m.editUserTitle()}</DialogTitle>
					<DialogDescription>{m.editUserDescription()}</DialogDescription>
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

						<Field>
							<FieldLabel htmlFor="edit-user-email">{m.userEmail()}</FieldLabel>
							<Input
								id="edit-user-email"
								name="email"
								value={user?.email ?? ''}
								disabled={true}
							/>
						</Field>
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
									{m.updatingButton()}
								</>
							) : (
								m.updateButton()
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
