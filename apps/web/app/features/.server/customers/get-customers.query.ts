import { customers } from '@/features/.server/customers/customer.schema';
import { db } from '@/features/.server/drizzle/drizzle.connection';
import { procedures } from '@/features/.server/trpc/trpc.init';

export const getCustomers = procedures.auth.query(async () => {
	return db.select().from(customers);
});
