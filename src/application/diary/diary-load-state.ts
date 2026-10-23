import type { DiaryLoadIdle } from '@application/diary/states/diary-load-idle';
import type { DiaryLoading } from '@application/diary/states/diary-loading';
import type { DiaryLoaded } from '@application/diary/states/diary-loaded';
import type { DiaryLoadError } from '@application/diary/states/diary-load-error';

/** Where one diary concern's load stands; "loading and failed" cannot be represented. */
export type DiaryLoadState =
  | DiaryLoadIdle
  | DiaryLoading
  | DiaryLoaded
  | DiaryLoadError;
