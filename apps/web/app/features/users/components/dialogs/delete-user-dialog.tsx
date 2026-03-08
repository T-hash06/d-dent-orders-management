import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	toast,
} from '@full-stack-template/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@/features/.server/users/user.types';
import { m } from '@/features/i18n/paraglide/messages';
import { useTRPC } from '@/features/trpc/trpc.context';

type DeleteUserDialogProps = {
	user: User | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteUserDialog({
	user,
	open,
	onOpenChange,
}: DeleteUserDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation(
		trpc.users.deleteUser.mutationOptions({
			onError: () => {
				toast.error(m.deleteUserFailed());
			},
			onSuccess: () => {
				toast.success(m.deleteUserSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.users.getUsers.queryKey(),
				});
				onOpenChange(false);
			},
		}),
	);

	const handleConfirm = () => {
		if (!user) {
			return;
		}

		deleteMutation.mutate({ userId: user.id });
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{m.deleteUserTitle()}</AlertDialogTitle>
					<AlertDialogDescription>
						{m.deleteUserDescription()}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={deleteMutation.isPending}>
						{m.cancelButton()}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={deleteMutation.isPending}
						variant="destructive"
					>
						{m.deleteUserConfirm()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
