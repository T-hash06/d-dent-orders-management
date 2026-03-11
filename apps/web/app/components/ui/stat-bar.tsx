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
				'grid divide-x divide-border overflow-hidden rounded-lg border border-border bg-card',
				className,
			)}
			style={{
				gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
			}}
		>
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="flex flex-col gap-0.5 px-3 py-2.5 sm:px-4 sm:py-3"
				>
					<p className="truncate text-[11px] font-medium leading-tight text-muted-foreground">
						{stat.label}
					</p>
					<p className="mt-0.5 text-base font-semibold tabular-nums text-foreground sm:text-xl">
						{stat.value}
					</p>
				</div>
			))}
		</div>
	);
}
