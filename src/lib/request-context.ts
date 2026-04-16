import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: string;
  locale?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Run a function within a request context.
 * The context is available to all code called within the callback.
 */
export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Get the current request context, or undefined if not in a request.
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}
