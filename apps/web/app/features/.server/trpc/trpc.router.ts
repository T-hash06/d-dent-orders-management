import { createTodo } from '@/features/.server/todos/create-todo.mutation';
import { getTodos } from '@/features/.server/todos/get-todos.query';
import {
	onToggleTodo,
	toggleTodo,
} from '@/features/.server/todos/toggle-todo.mutation';
import { t } from '@/features/.server/trpc/trpc.init';

const todos = t.router({
	getTodos: getTodos,
	toggleTodo: toggleTodo,

	createTodo: createTodo,

	onToggleTodo: onToggleTodo,
});

export const appRouter = t.router({
	todos,
});

export type AppRouter = typeof appRouter;
