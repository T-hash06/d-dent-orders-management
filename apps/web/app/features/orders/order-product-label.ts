type OrderProductLabelInput = {
	name?: string | null;
	category?:
		| {
				name?: string | null;
		  }
		| string
		| null;
	variant?: string | null;
};

const normalizeText = (value: string | null | undefined) => value?.trim() ?? '';

const getCategoryName = (category: OrderProductLabelInput['category']) => {
	if (typeof category === 'string') {
		return normalizeText(category);
	}

	if (category && typeof category === 'object') {
		return normalizeText(category.name);
	}

	return '';
};

export const getOrderProductCategoryLabel = (
	product: OrderProductLabelInput,
) => {
	const categoryName = getCategoryName(product.category);
	return categoryName;
};

export const getOrderProductDisplayLabel = (
	product: OrderProductLabelInput,
) => {
	const name = normalizeText(product.name);
	const details = [
		getOrderProductCategoryLabel(product),
		normalizeText(product.variant),
	]
		.filter(Boolean)
		.join(' · ');

	return [name, details].filter(Boolean).join(' — ');
};

export const getOrderProductSearchLabel = (product: OrderProductLabelInput) =>
	[
		normalizeText(product.name),
		getOrderProductCategoryLabel(product),
		normalizeText(product.variant),
	]
		.filter(Boolean)
		.join(' ');
