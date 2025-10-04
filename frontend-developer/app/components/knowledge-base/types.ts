export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  indexingTechnique: 'high_quality' | 'economy';
  permission: 'only_me' | 'all_team_members' | 'partial_members';
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  wordCount: number;
  status: 'completed' | 'indexing' | 'error';
  enabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface DocumentSegment {
  id: string;
  content: string;
  wordCount: number;
  position: number;
  enabled: boolean;
  hitCount: number;
  indexNodeHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChunkSettings {
  mode: 'automatic' | 'custom' | 'hierarchical' | 'structure';
  chunkSize?: number;
  chunkOverlap?: number;
  minSectionSize?: number;
  maxSectionSize?: number;
  headingPriority?: number;
  replaceExtraSpaces?: boolean;
  removeUrlsEmails?: boolean;
}

export interface CreateForm {
  name: string;
  description: string;
  indexingTechnique: 'high_quality' | 'economy';
  permission: 'only_me' | 'all_team_members' | 'partial_members';
  chunkSettings?: ChunkSettings;
}

export interface UploadForm {
  name: string;
  content: string;
  url?: string;
  indexingTechnique: 'high_quality' | 'economy';
  chunkSettings?: ChunkSettings;
}

export type ActiveSection = 'list' | 'create' | 'documents' | 'api-keys';
export type UploadMethod = 'text' | 'file' | 'url';
