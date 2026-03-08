export const ORDER_PAYMENT_STATUS_VALUES = ['pending', 'paid'] as const;

export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUS_VALUES)[number];
