import { cn } from '@d-dentaditamentos/ui';

export interface StatItem {
	label: string;
	value: string | number;
}

interface StatBarProps {
	stats: StatItem[];
	className?: string;
}

export function StatBar({ stats, className }: StatBarProps) {
	return (
		<div
			className={cn(
				'grid gap-4 grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]',
				className,
			)}
		>
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-border bg-card px-3 py-2.5 sm:px-4 sm:py-3"
				>
					<p className="truncate text-[11px] font-medium leading-tight text-muted-foreground">
						{stat.label}
					</p>
					<p className="mt-0.5 text-base leading-tight font-semibold tabular-nums text-foreground sm:text-lg lg:text-xl">
						{stat.value}
					</p>
				</div>
			))}
		</div>
	);
}
