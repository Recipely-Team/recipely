/**
 * Every backend endpoint path in one place. Paths are relative — `HttpClient`
 * prepends `API_BASE_URL`. Parameterised endpoints are builders that
 * encodeURIComponent their segments, matching the former inline templates.
 */
export const ApiRoutes = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    registerVerify: '/auth/register/verify',
    registerResend: '/auth/register/resend',
    social: '/auth/social',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  me: {
    root: '/me',
    profile: '/me/profile',
    favorites: '/me/favorites',
    likes: '/me/likes',
    recipes: '/me/recipes',
    deviceToken: '/me/device-token',
    notifications: '/me/notifications',
    notificationsReadAll: '/me/notifications/read-all',
    notificationRead: (id: string): string =>
      `/me/notifications/${encodeURIComponent(id)}/read`,
  },
  recipes: {
    root: '/recipes',
    trending: '/recipes/trending',
    cuisines: '/recipes/cuisines',
    categories: '/recipes/categories',
    generate: '/recipes/generate',
    import: '/recipes/import',
    /** Queues a background import and returns a job id, instead of waiting ~2 min. */
    importJobs: '/recipes/import/jobs',
    importJob: (id: string): string => `/recipes/import/jobs/${encodeURIComponent(id)}`,
    refine: '/recipes/refine',
    withMedia: '/recipes/with-media',
    drafts: '/recipes/drafts',
    draftsLatest: '/recipes/drafts/latest',
    byId: (id: string): string => `/recipes/${encodeURIComponent(id)}`,
    draft: (id: string): string => `/recipes/drafts/${encodeURIComponent(id)}`,
    like: (id: string): string => `/recipes/${encodeURIComponent(id)}/like`,
    favorite: (id: string): string => `/recipes/${encodeURIComponent(id)}/favorite`,
    /** The owner's gallery: one photo added, or one taken back off. */
    media: (id: string): string => `/recipes/${encodeURIComponent(id)}/media`,
    mediaItem: (id: string, mediaId: string): string =>
      `/recipes/${encodeURIComponent(id)}/media/${encodeURIComponent(mediaId)}`,
    comments: (recipeId: string): string =>
      `/recipes/${encodeURIComponent(recipeId)}/comments`,
    comment: (recipeId: string, commentId: string): string =>
      `/recipes/${encodeURIComponent(recipeId)}/comments/${encodeURIComponent(commentId)}`,
    commentLike: (recipeId: string, commentId: string): string =>
      `/recipes/${encodeURIComponent(recipeId)}/comments/${encodeURIComponent(commentId)}/like`,
  },
  users: {
    byId: (userId: string): string => `/users/${encodeURIComponent(userId)}`,
  },
  feedback: '/feedback',
  assistant: {
    session: '/assistant/session',
    heartbeat: '/assistant/heartbeat',
    message: '/assistant/message',
  },
} as const;
