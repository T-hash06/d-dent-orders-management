import { cn } from '@d-dentaditamentos/ui';
import type { ReactNode } from 'react';

interface PageHeaderProps {
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}

export function PageHeader({
	title,
	description,
	action,
	className,
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between',
				className,
			)}
		>
			<div className="min-w-0 flex-1">
				<h1 className="text-xl font-semibold leading-tight tracking-tight text-foreground">
					{title}
				</h1>
				{description && (
					<p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
				)}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
