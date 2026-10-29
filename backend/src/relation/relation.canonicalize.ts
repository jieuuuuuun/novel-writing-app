export interface RelationPairInput {
  characterAId: number;
  characterBId: number;
  aToBLabel: string;
  aToBNote: string;
  bToALabel: string;
  bToANote: string;
}

export function canonicalizeRelationInput(
  input: RelationPairInput,
): RelationPairInput {
  if (input.characterAId <= input.characterBId) {
    return { ...input };
  }

  return {
    characterAId: input.characterBId,
    characterBId: input.characterAId,
    aToBLabel: input.bToALabel,
    aToBNote: input.bToANote,
    bToALabel: input.aToBLabel,
    bToANote: input.aToBNote,
  };
}
