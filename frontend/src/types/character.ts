export interface Character {
  id: number;
  workId: number;
  name: string;
  role: string;
  age: string;
  occupation: string;
  summary: string;
  goal: string;
  trauma: string;
  weakness: string;
  lack: string;
  quote: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterProfile {
  height: string;
  bodyType: string;
  hair: string;
  eyes: string;
  skin: string;
  fashion: string;
  feature: string;
  appearanceNote: string;
  personality: string;
  likes: string;
  dislikes: string;
  secret: string;
  habits: string;
  speechMannerism: string;
  signature: string;
}

export interface CharacterCustomField {
  id: number;
  characterId: number;
  label: string;
  value: string;
  sortOrder: number;
  valueType: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterDetail extends Character {
  profile: CharacterProfile;
  customFields: CharacterCustomField[];
}

export interface CharacterCustomFieldDraft {
  clientKey: string;
  id?: number;
  label: string;
  value: string;
  sortOrder: number;
}

export interface CharacterFormState {
  name: string;
  role: string;
  age: string;
  occupation: string;
  summary: string;
  goal: string;
  trauma: string;
  weakness: string;
  lack: string;
  quote: string;
  profile: CharacterProfile;
  customFields: CharacterCustomFieldDraft[];
}

export type CreateCharacterInput = Omit<
  CharacterFormState,
  "profile" | "customFields"
>;
export type UpdateCharacterInput = CreateCharacterInput & {
  profile: CharacterProfile;
  customFields: {
    id?: number;
    label: string;
    value: string;
    sortOrder: number;
  }[];
};

export const CHARACTER_FIELD_LIMITS = {
  name: 100,
  role: 100,
  age: 50,
  occupation: 100,
  summary: 300,
} as const;

export const CHARACTER_PROFILE_LIMITS = {
  height: 100,
  bodyType: 100,
  hair: 200,
  eyes: 200,
  skin: 100,
  fashion: 200,
  feature: 200,
} as const;

export const emptyCharacterProfile: CharacterProfile = {
  height: "",
  bodyType: "",
  hair: "",
  eyes: "",
  skin: "",
  fashion: "",
  feature: "",
  appearanceNote: "",
  personality: "",
  likes: "",
  dislikes: "",
  secret: "",
  habits: "",
  speechMannerism: "",
  signature: "",
};

export const emptyCharacterForm: CharacterFormState = {
  name: "",
  role: "",
  age: "",
  occupation: "",
  summary: "",
  goal: "",
  trauma: "",
  weakness: "",
  lack: "",
  quote: "",
  profile: emptyCharacterProfile,
  customFields: [],
};
