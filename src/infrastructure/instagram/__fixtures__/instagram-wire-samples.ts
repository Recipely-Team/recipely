/**
 * Bodies of the Instagram endpoints written as the wire contract spells them
 * (backend #374), as JSON text — never built from this app's DTO types (see
 * docs/regressions.md → "a fixture typed by the DTO it tests").
 */
export const InstagramWireSamples = {
  connection: `{ "connected": true, "available": true, "username": "mertmutfakta", "igUserId": "1784", "status": "expired",
    "tokenExpiresAt": "2026-11-30T10:00:00.000Z", "connectedAt": "2026-10-01T10:00:00.000Z" }`,
  finalize: `{ "connection": { "connected": true, "available": true, "username": "mertmutfakta", "igUserId": "1784", "status": "active",
    "tokenExpiresAt": "2026-12-01T10:00:00.000Z", "connectedAt": "2026-10-02T10:00:00.000Z" }, "creatorTag": "approved" }`,
  mediaPage: `{ "items": [
    { "id": "m1", "mediaType": "VIDEO", "thumbnailUrl": "https://cdn.test/1.jpg", "caption": "Menemen", "permalink": "https://instagram.com/reel/1", "timestamp": "2026-09-30T10:00:00+0000" },
    { "id": "m2", "mediaType": "STORY", "thumbnailUrl": null, "caption": null, "permalink": null, "timestamp": null }
  ], "total": 30, "page": 2, "pageSize": 9 }`,
  rulesPage: `{ "items": [{
    "id": "r1", "mediaId": "m1", "media": { "permalink": "https://instagram.com/reel/1", "thumbnailUrl": null, "caption": "Menemen" },
    "keywords": ["tarif", "recipe"], "recipeId": "rec1", "recipe": { "id": "rec1", "name": "Menemen", "image": null },
    "dmText": "Hi {name}! {link}", "publicReplyText": null, "enabled": true, "sentCount": 124,
    "createdAt": "2026-10-01T10:00:00.000Z", "updatedAt": "2026-10-01T10:00:00.000Z"
  }], "total": 6, "page": 1, "pageSize": 5 }`,
  sendsPage: `{ "items": [
    { "id": "s1", "commentId": "c1", "commenterUsername": "zeynep", "commentText": "tarif lütfen", "status": "sent", "reason": null,
      "publicReplied": true, "createdAt": "2026-10-02T09:00:00.000Z", "sentAt": "2026-10-02T09:00:05.000Z" },
    { "id": "s2", "commentId": "c2", "commenterUsername": null, "commentText": "recipe?", "status": "failed", "reason": "too_old",
      "publicReplied": false, "createdAt": "2026-09-20T09:00:00.000Z", "sentAt": null }
  ], "total": 2, "page": 1, "pageSize": 8 }`,
} as const;
