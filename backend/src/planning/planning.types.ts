export interface PlanningCustomFieldResponse {
  id: number;
  planningId: number;
  label: string;
  value: string;
  sortOrder: number;
  valueType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanningResponse {
  id: number | null;
  workId: number;
  genre: string;
  subgenre: string;
  targetAudience: string;
  keywords: string;
  logline: string;
  introduction: string;
  customFields: PlanningCustomFieldResponse[];
  createdAt: Date | null;
  updatedAt: Date | null;
}
