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
import { m } from '@/features/i18n/paraglide/messages';
import type { Order } from '@/features/orders/orders.columns';
import { useTRPC } from '@/features/trpc/trpc.context';

type DeleteOrderDialogProps = {
	order: Order | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteOrderDialog({
	order,
	open,
	onOpenChange,
}: DeleteOrderDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation(
		trpc.orders.deleteOrder.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: trpc.orders.getOrders.queryKey(),
				});

				const previous = queryClient.getQueryData(
					trpc.orders.getOrders.queryKey(),
				);

				queryClient.setQueryData(
					trpc.orders.getOrders.queryKey(),
					(old: Order[] | undefined) =>
						(old ?? []).filter((o) => o.id !== variables.id),
				);

				return { previous };
			},
			onError: (_error, _variables, context) => {
				if (context?.previous) {
					queryClient.setQueryData(
						trpc.orders.getOrders.queryKey(),
						context.previous,
					);
				}
				toast.error(m.deleteOrderFailed());
			},
			onSuccess: () => {
				toast.success(m.deleteOrderSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.orders.getOrders.queryKey(),
				});
				onOpenChange(false);
			},
		}),
	);

	const handleConfirm = () => {
		if (!order) return;
		deleteMutation.mutate({ id: order.id });
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{m.deleteOrderTitle()}</AlertDialogTitle>
					<AlertDialogDescription>
						{m.deleteOrderDescription()}
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
						{m.deleteOrderConfirm()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
