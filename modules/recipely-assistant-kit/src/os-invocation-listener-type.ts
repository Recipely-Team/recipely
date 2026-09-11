import type { OsIntentInvocation } from './os-intent-invocation';

/** Called when an intent fires while the app is already running. */
export type OsInvocationListenerType = (invocation: OsIntentInvocation) => void;
