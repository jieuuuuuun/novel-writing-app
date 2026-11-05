export interface SynopsisListItemResponse {
  id: number;
  title: string;
  sortOrder: number;
  isCurrent: boolean;
  updatedAt: Date;
}

export interface SynopsisListResponse {
  currentId: number | null;
  items: SynopsisListItemResponse[];
}

export interface SynopsisDetailResponse {
  id: number;
  workId: number;
  title: string;
  summary: string;
  beginning: string;
  development: string;
  crisis: string;
  ending: string;
  memo: string;
  sortOrder: number;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SynopsisCurrentResponse {
  current: SynopsisDetailResponse | null;
}

export interface SynopsisCurrentIdResponse {
  currentId: number;
}

export interface SynopsisDeleteResponse {
  deletedId: number;
  currentId: number | null;
}
