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
import type { Customer } from '@/features/customers/customers.columns';
import { m } from '@/features/i18n/paraglide/messages';
import { useTRPC } from '@/features/trpc/trpc.context';

type DeleteCustomerDialogProps = {
	customer: Customer | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteCustomerDialog({
	customer,
	open,
	onOpenChange,
}: DeleteCustomerDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation(
		trpc.customers.deleteCustomer.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: trpc.customers.getCustomers.queryKey(),
				});

				const previous = queryClient.getQueryData(
					trpc.customers.getCustomers.queryKey(),
				);

				queryClient.setQueryData(
					trpc.customers.getCustomers.queryKey(),
					(old: Customer[] | undefined) =>
						(old ?? []).filter((c) => c.id !== variables.id),
				);

				return { previous };
			},
			onError: (_error, _variables, context) => {
				if (context?.previous) {
					queryClient.setQueryData(
						trpc.customers.getCustomers.queryKey(),
						context.previous,
					);
				}
				toast.error(m.deleteCustomerFailed());
			},
			onSuccess: () => {
				toast.success(m.deleteCustomerSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.customers.getCustomers.queryKey(),
				});
				onOpenChange(false);
			},
		}),
	);

	const handleConfirm = () => {
		if (!customer) return;
		deleteMutation.mutate({ id: customer.id });
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{m.deleteCustomerTitle()}</AlertDialogTitle>
					<AlertDialogDescription>
						{m.deleteCustomerDescription()}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={deleteMutation.isPending}>
						{m.cancelButton()}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={deleteMutation.isPending}
						className="bg-destructive text-white hover:bg-destructive/90"
					>
						{m.deleteCustomerConfirm()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
