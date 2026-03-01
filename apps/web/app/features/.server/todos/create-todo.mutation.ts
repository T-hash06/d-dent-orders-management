import * as z from 'zod';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { todos } from '@/features/.server/todos/todo.schema';
import { getLocaleFromAsyncStorage } from '@/features/.server/trpc/locale.context';
import { procedures } from '@/features/.server/trpc/trpc.init';
import { m } from '@/features/i18n/paraglide/messages';

const createTodoSchema = z.object({
	title: z.string().min(1, {
		error: () =>
			m.todoTitleRequired({}, { locale: getLocaleFromAsyncStorage() }),
	}),
	description: z.string().optional(),
});

export const createTodo = procedures.auth
	.input(createTodoSchema)
	.mutation(async ({ input, ctx }) => {
		const userId = ctx.user.id;

		const newTodo = await db
			.insert(todos)
			.values({
				title: input.title,
				description: input.description,
				completed: false,
				userId,
			})
			.returning();

		return newTodo[0];
	});
