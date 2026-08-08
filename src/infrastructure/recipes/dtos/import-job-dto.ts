// Wire shape of `POST /recipes/import/jobs` and `GET /recipes/import/jobs/:id`.
// Keep in sync with recipely-backend `import-job.dto.ts`.
export interface ImportJobDto {
  id: string;
  status: string;
  draftId: string | null;
  errorKey: string | null;
  /** 1-based place in the queue, or null once the job is no longer waiting. */
  queuePosition: number | null;
  createdAt: string;
  updatedAt: string;
}
