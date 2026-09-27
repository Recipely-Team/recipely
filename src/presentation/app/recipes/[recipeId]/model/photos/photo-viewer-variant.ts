/**
 * The two shapes the recipe's photo viewer takes.
 *
 * `Bleed` runs edge to edge under the phone's status bar and carries the top
 * scrim; `Framed` sits in the wide layout's column with a radius and a border.
 * The layout picks it, not the platform: an iPad in the wide layout is framed.
 */
export const PhotoViewerVariant = {
  Bleed: 'bleed',
  Framed: 'framed',
} as const;

export type PhotoViewerVariantType = (typeof PhotoViewerVariant)[keyof typeof PhotoViewerVariant];
