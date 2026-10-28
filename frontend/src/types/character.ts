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
}

export type CreateCharacterInput = CharacterFormState;
export type UpdateCharacterInput = CharacterFormState;

export const CHARACTER_FIELD_LIMITS = {
  name: 100,
  role: 100,
  age: 50,
  occupation: 100,
  summary: 300,
} as const;

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
};
