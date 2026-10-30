import { notifyUnauthorized } from "@/lib/auth-api";
import type {
  Character,
  CharacterDetail,
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";

const CHARACTERS_API_PATH = (workId: number) =>
  `/api/work/${workId}/characters`;

const CHARACTER_API_PATH = (workId: number, characterId: number) =>
  `/api/work/${workId}/characters/${characterId}`;

async function readCharacterError(response: Response): Promise<string> {
  if (response.status === 401) {
    notifyUnauthorized();
  }

  try {
    const body = (await response.json()) as {
      message?: string | string[];
    };

    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function getCharacters(
  workId: number,
  signal?: AbortSignal,
): Promise<Character[] | null> {
  const response = await fetch(CHARACTERS_API_PATH(workId), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readCharacterError(response));
  }

  return (await response.json()) as Character[];
}

export async function createCharacter(
  workId: number,
  payload: CreateCharacterInput,
): Promise<Character> {
  const response = await fetch(CHARACTERS_API_PATH(workId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readCharacterError(response));
  }

  return (await response.json()) as Character;
}

export async function getCharacter(
  workId: number,
  characterId: number,
  signal?: AbortSignal,
): Promise<CharacterDetail | null> {
  const response = await fetch(CHARACTER_API_PATH(workId, characterId), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readCharacterError(response));
  }

  return (await response.json()) as CharacterDetail;
}

export async function updateCharacter(
  workId: number,
  characterId: number,
  payload: UpdateCharacterInput,
): Promise<CharacterDetail> {
  const response = await fetch(CHARACTER_API_PATH(workId, characterId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readCharacterError(response));
  }

  return (await response.json()) as CharacterDetail;
}

export async function deleteCharacter(
  workId: number,
  characterId: number,
): Promise<void> {
  const response = await fetch(CHARACTER_API_PATH(workId, characterId), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readCharacterError(response));
  }
}
