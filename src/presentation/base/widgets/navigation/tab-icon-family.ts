/** Which icon font a tab's glyph comes from: Ionicons for most, Material Community for the chef hat Ionicons lacks. */
export const TabIconFamily = {
  Ionicons: 'ionicons',
  Material: 'material',
} as const;

export type TabIconFamilyType = (typeof TabIconFamily)[keyof typeof TabIconFamily];
