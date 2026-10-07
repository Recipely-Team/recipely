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
    /** The signed-in user's creator claims: PUT `{ platform, handle }` to request one. */
    creator: '/me/creator',
    /** DELETE clears one platform's claim, whatever its status. */
    creatorPlatform: (platform: string): string => `/me/creator/${encodeURIComponent(platform)}`,
    deviceToken: '/me/device-token',
    devices: '/me/devices',
    notifications: '/me/notifications',
    notificationsReadAll: '/me/notifications/read-all',
    notificationRead: (id: string): string =>
      `/me/notifications/${encodeURIComponent(id)}/read`,
  },
  shopping: {
    /** GET a page; DELETE empties the list. */
    list: '/me/shopping-list',
    /** POST a batch of lines. */
    items: '/me/shopping-list/items',
    /** DELETE every checked line. */
    checked: '/me/shopping-list/items/checked',
    item: (id: string): string => `/me/shopping-list/items/${encodeURIComponent(id)}`,
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
    /** Photos of a recipe's pages, or a PDF, read into a draft (multipart, synchronous). */
    importFile: '/recipes/import/file',
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
    /** The cover photo, removed everywhere it appears. */
    cover: (id: string): string => `/recipes/${encodeURIComponent(id)}/cover`,
    /** Owner: offer a private recipe for publishing. */
    publish: (id: string): string => `/recipes/${encodeURIComponent(id)}/publish`,
    /** Owner: take a recipe back to private. */
    unpublish: (id: string): string => `/recipes/${encodeURIComponent(id)}/unpublish`,
    comments: (recipeId: string): string =>
      `/recipes/${encodeURIComponent(recipeId)}/comments`,
    comment: (recipeId: string, commentId: string): string =>
      `/recipes/${encodeURIComponent(recipeId)}/comments/${encodeURIComponent(commentId)}`,
    commentLike: (recipeId: string, commentId: string): string =>
      `/recipes/${encodeURIComponent(recipeId)}/comments/${encodeURIComponent(commentId)}/like`,
  },
  users: {
    /** Approved creators with a published recipe; the backend registers it before `/users/:id`. */
    creators: '/users/creators',
    byId: (userId: string): string => `/users/${encodeURIComponent(userId)}`,
    /** A user's published recipes; open to guests. */
    recipes: (userId: string): string => `/users/${encodeURIComponent(userId)}/recipes`,
    /** POST to follow, DELETE to stop following (auth). */
    follow: (userId: string): string => `/users/${encodeURIComponent(userId)}/follow`,
  },
  feedback: '/feedback',
  /** The admin panel's on/off overrides of the app's feature flags; open to guests. */
  flags: '/flags',
  /** The signed-in user's food diary; every route is scoped to the session's user. */
  diary: {
    day: (date: string): string => `/diary/days/${encodeURIComponent(date)}`,
    dayWater: (date: string): string => `/diary/days/${encodeURIComponent(date)}/water`,
    month: (month: string): string => `/diary/months/${encodeURIComponent(month)}`,
    recent: '/diary/recent',
    entries: '/diary/entries',
    entry: (id: string): string => `/diary/entries/${encodeURIComponent(id)}`,
    goals: '/diary/goals',
    /** What the Add food sheet can log: grouped search, curated catalogue, branded packs, recent foods. */
    foods: {
      search: '/diary/foods/search',
      products: '/diary/foods/products',
      product: (foodId: string): string => `/diary/foods/products/${encodeURIComponent(foodId)}`,
      barcode: (barcode: string): string => `/diary/foods/products/barcode/${encodeURIComponent(barcode)}`,
      categories: '/diary/foods/categories',
      recent: '/diary/foods/recent',
    },
  },
  /** The viewer's Instagram link and comment-to-DM rules (backend #374). */
  instagram: {
    start: '/auth/instagram/start',
    connection: '/me/instagram',
    finalize: '/me/instagram/finalize',
    media: '/me/instagram/media',
    rules: '/me/instagram/rules',
    rule: (id: string): string => `/me/instagram/rules/${encodeURIComponent(id)}`,
    sends: (ruleId: string): string => `/me/instagram/rules/${encodeURIComponent(ruleId)}/sends`,
  },
  assistant: {
    session: '/assistant/session',
    heartbeat: '/assistant/heartbeat',
    message: '/assistant/message',
    intentToken: '/assistant/intent-token',
  },
} as const;
