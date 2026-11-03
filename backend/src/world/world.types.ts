export interface WorldCustomFieldResponse {
  id: number;
  settingId: number;
  label: string;
  value: string;
  sortOrder: number;
  valueType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldResponse {
  id: number | null;
  workId: number;
  era: string;
  places: string;
  atmosphere: string;
  customFields: WorldCustomFieldResponse[];
  createdAt: Date | null;
  updatedAt: Date | null;
}
