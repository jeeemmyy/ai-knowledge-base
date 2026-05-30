export interface Document {
  id: string;
  userId: string;
  sourceFileId: string | null;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title: string;
  content: string;
  tags?: string[];
}

export type UpdateDocumentInput = Partial<CreateDocumentInput>;
