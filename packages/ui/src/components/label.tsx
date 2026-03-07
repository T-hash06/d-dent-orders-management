import type * as React from 'react';
import { cn } from '@/lib/utils';

function Label({
	className,
	htmlFor,
	children,
	...props
}: React.ComponentProps<'label'>) {
	if (!htmlFor && !children) {
		console.warn(
			'Label component should have either an "htmlFor" prop or children (input element) for accessibility.',
		);
	}
	return (
		<label
			data-slot="label"
			className={cn(
				'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
				className,
			)}
			htmlFor={htmlFor}
			{...props}
		>
			{children}
		</label>
	);
}

export { Label };
