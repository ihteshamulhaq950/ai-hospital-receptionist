
export type DashboardStats = {
  totalDocuments: number;
  recentDocumentsCount: number;
  totalPages: number;
  totalChunks: number;
  recentUploads: Array<{
    id: string;
    pdf_name: string;
    file_size: number;
    document_chunks: number;
  }>;
  patientQueries: number | null;
  activeUsers: number | null;
};
