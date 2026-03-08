ALTER TABLE `order_items` ADD `details` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_status` text DEFAULT 'pending' NOT NULL;