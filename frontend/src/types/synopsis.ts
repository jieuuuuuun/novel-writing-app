export interface SynopsisListItem {
  id: number;
  title: string;
  sortOrder: number;
  isCurrent: boolean;
  updatedAt: string;
}

export interface SynopsisListResponse {
  currentId: number | null;
  items: SynopsisListItem[];
}

export interface SynopsisDetail {
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
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
}

export interface SynopsisCurrentResponse {
  current: SynopsisDetail | null;
}

export interface SynopsisCurrentIdResponse {
  currentId: number;
}

export interface SynopsisDeleteResponse {
  deletedId: number;
  currentId: number | null;
}

export interface SynopsisFormState {
  title: string;
  summary: string;
  beginning: string;
  development: string;
  crisis: string;
  ending: string;
  memo: string;
}

export interface CreateSynopsisInput {
  title?: string;
}

export interface UpdateSynopsisInput {
  title?: string;
  summary?: string;
  beginning?: string;
  development?: string;
  crisis?: string;
  ending?: string;
  memo?: string;
}

export const SYNOPSIS_TITLE_MAX = 100;

export const emptySynopsisForm: SynopsisFormState = {
  title: "",
  summary: "",
  beginning: "",
  development: "",
  crisis: "",
  ending: "",
  memo: "",
};
