import type { Page } from '@domain/common/page';

/**
 * Where a store's list stands against the server: the last page it holds, the
 * server's total and whether more pages exist — the `Page` envelope's own
 * fields, kept beside the list's rows so the screens reading those rows stay
 * as they are — plus whether the next page is on its way.
 */
export type ListPaging = Omit<Page<unknown>, 'items' | 'pageSize'> & { readonly isLoadingMore: boolean };
