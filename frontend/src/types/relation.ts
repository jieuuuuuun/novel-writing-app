export interface RelationCharacter {
  id: number;
  name: string;
  role: string;
}

export interface Relation {
  id: number;
  workId: number;
  type: string;
  summary: string;
  characterA: RelationCharacter;
  characterB: RelationCharacter;
  aToBLabel: string;
  aToBNote: string;
  bToALabel: string;
  bToANote: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelationFormState {
  characterAId: string;
  characterBId: string;
  type: string;
  summary: string;
  aToBLabel: string;
  aToBNote: string;
  bToALabel: string;
  bToANote: string;
}

export interface CreateRelationInput {
  characterAId: number;
  characterBId: number;
  type: string;
  summary: string;
  aToBLabel: string;
  aToBNote: string;
  bToALabel: string;
  bToANote: string;
}

export type UpdateRelationInput = CreateRelationInput;

export const RELATION_FIELD_LIMITS = {
  type: 50,
  summary: 300,
  label: 50,
} as const;

export const emptyRelationForm: RelationFormState = {
  characterAId: "",
  characterBId: "",
  type: "",
  summary: "",
  aToBLabel: "",
  aToBNote: "",
  bToALabel: "",
  bToANote: "",
};
