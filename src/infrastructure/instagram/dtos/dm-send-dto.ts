// One item of `GET /me/instagram/rules/:id/sends`.
export interface DmSendDto {
  id: string;
  commentId: string;
  commenterUsername: string | null;
  commentText: string | null;
  status: string;
  reason: string | null;
  publicReplied: boolean;
  createdAt: string;
  sentAt: string | null;
}
