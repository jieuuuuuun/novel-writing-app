export interface PlanningCustomField {
  id: number;
  planningId: number;
  label: string;
  value: string;
  sortOrder: number;
  valueType: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningCustomFieldDraft {
  clientKey: string;
  id?: number;
  label: string;
  value: string;
  sortOrder: number;
}

export interface Planning {
  id: number | null;
  workId: number;
  genre: string;
  subgenre: string;
  targetAudience: string;
  keywords: string;
  logline: string;
  introduction: string;
  customFields: PlanningCustomField[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdatePlanningInput {
  genre: string;
  subgenre: string;
  targetAudience: string;
  keywords: string;
  logline: string;
  introduction: string;
  customFields: {
    id?: number;
    label: string;
    value: string;
    sortOrder: number;
  }[];
}
