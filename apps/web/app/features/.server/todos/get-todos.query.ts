import { eq } from 'drizzle-orm';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { todos } from '@/features/.server/todos/todo.schema';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getTodos = procedures.auth.query(async ({ ctx }) => {
	const todosList = await db
		.select()
		.from(todos)
		.where(eq(todos.userId, ctx.user.id));

	return todosList;
});
