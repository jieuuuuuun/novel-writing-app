import { canonicalizeRelationInput } from './relation.canonicalize.js';

describe('canonicalizeRelationInput', () => {
  it('keeps A/B and directional fields when characterAId is smaller', () => {
    expect(
      canonicalizeRelationInput({
        characterAId: 2,
        characterBId: 5,
        aToBLabel: '친구',
        aToBNote: '2는 5를 친구로 생각함',
        bToALabel: '짝사랑',
        bToANote: '5가 2를 좋아함',
      }),
    ).toEqual({
      characterAId: 2,
      characterBId: 5,
      aToBLabel: '친구',
      aToBNote: '2는 5를 친구로 생각함',
      bToALabel: '짝사랑',
      bToANote: '5가 2를 좋아함',
    });
  });

  it('swaps ids and directional fields when characterAId is larger', () => {
    expect(
      canonicalizeRelationInput({
        characterAId: 5,
        characterBId: 2,
        aToBLabel: '짝사랑',
        aToBNote: '5가 2를 좋아함',
        bToALabel: '친구',
        bToANote: '2는 5를 친구로 생각함',
      }),
    ).toEqual({
      characterAId: 2,
      characterBId: 5,
      aToBLabel: '친구',
      aToBNote: '2는 5를 친구로 생각함',
      bToALabel: '짝사랑',
      bToANote: '5가 2를 좋아함',
    });
  });
});
