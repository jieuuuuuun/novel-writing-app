export interface RelationCharacterSummary {
  id: number;
  name: string;
  role: string;
}

export interface RelationResponse {
  id: number;
  workId: number;
  type: string;
  summary: string;
  characterA: RelationCharacterSummary;
  characterB: RelationCharacterSummary;
  aToBLabel: string;
  aToBNote: string;
  bToALabel: string;
  bToANote: string;
  createdAt: Date;
  updatedAt: Date;
}
