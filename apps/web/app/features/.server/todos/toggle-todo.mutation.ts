import { on } from 'node:events';
import { eq, sql } from 'drizzle-orm';
import * as z from 'zod';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { eventBus } from '@/features/.server/event-bus/event-bus.constant';
import { type Todo, todos } from '@/features/.server/todos/todo.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const toggleTodoInput = z.object({
	id: z.string(),
});

export const toggleTodo = procedures.auth
	.input(toggleTodoInput)
	.mutation(async ({ input }) => {
		const [toggledTodo] = await db
			.update(todos)
			.set({ completed: sql`NOT ${todos.completed}` })
			.where(eq(todos.id, input.id))
			.returning();

		eventBus.emit('todoToggled', toggledTodo);
	});

export const onToggleTodo = procedures.auth.subscription(
	async function* (options) {
		for await (const [data] of on(eventBus, 'todoToggled', {
			signal: options.signal,
		})) {
			const todo = data as Todo;
			yield todo;
		}
	},
);
