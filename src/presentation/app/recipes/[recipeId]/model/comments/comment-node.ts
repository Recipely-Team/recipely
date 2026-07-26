import type { ComponentRef } from 'react';
import type { View } from 'react-native';

/**
 * Host handle of a rendered `CommentCard` root view — the thing `measureLayout`
 * needs to resolve a comment's y offset inside the detail ScrollView. Exists on
 * both react-native and react-native-web.
 */
export type CommentNode = ComponentRef<typeof View>;
