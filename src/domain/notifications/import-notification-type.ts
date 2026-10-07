/**
 * The notification type a queued import sends when it ends — on success and,
 * with neither a draft nor a recipe behind it, on failure too.
 */
export const ImportNotificationType = {
  Done: 'import_done',
} as const;
