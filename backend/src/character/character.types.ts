export interface CharacterListResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export type CharacterResponse = CharacterListResponse;

export interface CharacterProfileResponse {
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

export interface CharacterCustomFieldResponse {
  id: number;
  characterId: number;
  label: string;
  value: string;
  sortOrder: number;
  valueType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterDetailResponse extends CharacterListResponse {
  profile: CharacterProfileResponse;
  customFields: CharacterCustomFieldResponse[];
}
