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
import type { Product } from '@/features/.server/products/product.types';
import { m } from '@/features/i18n/paraglide/messages';
import { useTRPC } from '@/features/trpc/trpc.context';

type DeleteProductDialogProps = {
	product: Product | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteProductDialog({
	product,
	open,
	onOpenChange,
}: DeleteProductDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation(
		trpc.products.deleteProduct.mutationOptions({
			onMutate: async (variables) => {
				await queryClient.cancelQueries({
					queryKey: trpc.products.getProducts.queryKey(),
				});

				const previous = queryClient.getQueryData(
					trpc.products.getProducts.queryKey(),
				);

				queryClient.setQueryData(
					trpc.products.getProducts.queryKey(),
					(old: Product[] | undefined) =>
						(old ?? []).filter((p) => p.id !== variables.id),
				);

				return { previous };
			},
			onError: (_error, _variables, context) => {
				if (context?.previous) {
					queryClient.setQueryData(
						trpc.products.getProducts.queryKey(),
						context.previous,
					);
				}
				toast.error(m.deleteProductFailed());
			},
			onSuccess: () => {
				toast.success(m.deleteProductSuccess());
				queryClient.invalidateQueries({
					queryKey: trpc.products.getProducts.queryKey(),
				});
				onOpenChange(false);
			},
		}),
	);

	const handleConfirm = () => {
		if (!product) return;
		deleteMutation.mutate({ id: product.id });
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{m.deleteProductTitle()}</AlertDialogTitle>
					<AlertDialogDescription>
						{m.deleteProductDescription()}
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
						{m.deleteProductConfirm()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
