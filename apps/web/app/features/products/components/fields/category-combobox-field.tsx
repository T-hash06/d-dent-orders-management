import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@d-dentaditamentos/ui';
import { Plus } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import type { ProductCategory } from '@/features/.server/products/product.types';
import { m } from '@/features/i18n/paraglide/messages';
import {
	getNewCategoryName,
	isNewCategory,
	NEW_CATEGORY_PREFIX,
} from '@/features/products/domain/product-category';

type CategoryComboboxFieldProps = {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	categories: ProductCategory[];
	disabled?: boolean;
	isInvalid?: boolean;
};

export function CategoryComboboxField({
	id,
	value,
	onChange,
	onBlur,
	categories,
	disabled,
	isInvalid,
}: CategoryComboboxFieldProps) {
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState('');

	const displayLabel = (() => {
		if (!value) return null;
		if (isNewCategory(value)) return getNewCategoryName(value);
		return categories.find((c) => c.id === value)?.name ?? null;
	})();

	const trimmedInput = inputValue.trim();
	const exactMatch = categories.some(
		(c) => c.name.toLowerCase() === trimmedInput.toLowerCase(),
	);
	const showCreateOption = trimmedInput.length > 0 && !exactMatch;

	const handleSelect = (selectedValue: string) => {
		onChange(selectedValue);
		setOpen(false);
		setInputValue('');
		onBlur?.();
	};

	const handleCreateNew = () => {
		const name = inputValue.trim();
		if (!name) return;
		onChange(`${NEW_CATEGORY_PREFIX}${name}`);
		setOpen(false);
		setInputValue('');
		onBlur?.();
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setInputValue('');
			onBlur?.();
		}
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger
				render={
					<Button
						id={id}
						type="button"
						variant="outline"
						role="combobox"
						aria-expanded={open}
						aria-invalid={isInvalid}
						disabled={disabled}
						className={cn(
							'h-9 w-full justify-between font-normal',
							!displayLabel && 'text-muted-foreground',
						)}
					/>
				}
			>
				{displayLabel ? (
					<span className="flex min-w-0 items-center gap-2">
						{isNewCategory(value) && (
							<span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
								{m.newCategoryBadge()}
							</span>
						)}
						<span className="truncate">{displayLabel}</span>
					</span>
				) : (
					m.productCategoryPlaceholder()
				)}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="ml-2 h-4 w-4 shrink-0 opacity-40"
					aria-hidden="true"
				>
					<path d="m7 15 5 5 5-5" />
					<path d="m7 9 5-5 5 5" />
				</svg>
			</PopoverTrigger>

			<PopoverContent
				className="p-0"
				align="start"
				style={{ minWidth: 'var(--anchor-width)' }}
			>
				<Command
					filter={(itemValue, search) => {
						if (!search) return 1;
						if (itemValue.startsWith(NEW_CATEGORY_PREFIX)) return 1;
						const category = categories.find((c) => c.id === itemValue);
						if (!category) return 0;
						return category.name.toLowerCase().includes(search.toLowerCase())
							? 1
							: 0;
					}}
				>
					<CommandInput
						placeholder={m.categorySearchPlaceholder()}
						value={inputValue}
						onValueChange={setInputValue}
					/>
					<CommandList>
						<CommandEmpty>{m.noCategoryFound()}</CommandEmpty>

						{categories.length > 0 && (
							<CommandGroup>
								{categories.map((category) => (
									<CommandItem
										key={category.id}
										value={category.id}
										data-checked={value === category.id ? 'true' : undefined}
										onSelect={() => handleSelect(category.id)}
									>
										{category.name}
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{showCreateOption && (
							<>
								{categories.length > 0 && <CommandSeparator />}
								<CommandGroup>
									<CommandItem
										value={`${NEW_CATEGORY_PREFIX}${trimmedInput}`}
										className="text-primary"
										onSelect={handleCreateNew}
									>
										<HugeiconsIcon icon={Plus} className="h-4 w-4" />
										{m.createNewCategory({ name: trimmedInput })}
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
