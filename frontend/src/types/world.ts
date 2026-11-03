export interface WorldSettingCustomField {
  id: number;
  settingId: number;
  label: string;
  value: string;
  sortOrder: number;
  valueType: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorldSettingCustomFieldDraft {
  clientKey: string;
  id?: number;
  label: string;
  value: string;
  sortOrder: number;
}

export interface WorldSetting {
  id: number | null;
  workId: number;
  era: string;
  places: string;
  atmosphere: string;
  customFields: WorldSettingCustomField[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateWorldSettingInput {
  era: string;
  places: string;
  atmosphere: string;
  customFields: {
    id?: number;
    label: string;
    value: string;
    sortOrder: number;
  }[];
}
