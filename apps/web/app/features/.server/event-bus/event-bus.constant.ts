import { EventEmitter } from 'node:events';

// TODO: Replace this in-memory emitter with a durable pub/sub solution
// (e.g. Redis, NATS, Kafka) when we need cross-instance events.
// TODO: Add typed event contracts and wrapper helpers for safer emits/listeners.
// TODO: Add observability hooks (metrics/tracing) for emitted and handled events.
export const eventBus = new EventEmitter();
