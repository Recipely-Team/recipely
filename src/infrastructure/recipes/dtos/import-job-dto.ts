// Wire shape of `POST /recipes/import/jobs` and `GET /recipes/import/jobs/:id`.
// Keep in sync with recipely-backend `import-job.dto.ts`.
export interface ImportJobDto {
  id: string;
  status: string;
  draftId: string | null;
  errorKey: string | null;
  createdAt: string;
  updatedAt: string;
}
