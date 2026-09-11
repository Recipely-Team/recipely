/**
 * What a fallible operation returns: a value, or a failure the caller must look at.
 *
 * The package throws nothing across its boundary. An app maps `AssistantFailure`
 * codes to its own errors and copy — the one piece of integration every
 * consumer writes.
 */
export type Result<T, F> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly failure: F };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const fail = <F>(failure: F): Result<never, F> => ({ ok: false, failure });
