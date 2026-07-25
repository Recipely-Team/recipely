/** What the avatar-upload hook hands back to the profile screen. */
export interface AvatarUpload {
  pickAndUpload: () => Promise<void>;
  isUploading: boolean;
  /** Localized message for the upload-failure dialog; null when there is none. */
  uploadError: string | null;
  onDismissUploadError: () => void;
}
