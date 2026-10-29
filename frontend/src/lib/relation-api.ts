import { notifyUnauthorized } from "@/lib/auth-api";
import type {
  CreateRelationInput,
  Relation,
  UpdateRelationInput,
} from "@/types/relation";

const RELATIONS_API_PATH = (workId: number) =>
  `/api/work/${workId}/relations`;

const RELATION_API_PATH = (workId: number, relationId: number) =>
  `/api/work/${workId}/relations/${relationId}`;

async function readRelationError(response: Response): Promise<string> {
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

export async function getRelations(
  workId: number,
  signal?: AbortSignal,
): Promise<Relation[] | null> {
  const response = await fetch(RELATIONS_API_PATH(workId), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readRelationError(response));
  }

  return (await response.json()) as Relation[];
}

export async function createRelation(
  workId: number,
  payload: CreateRelationInput,
): Promise<Relation> {
  const response = await fetch(RELATIONS_API_PATH(workId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readRelationError(response));
  }

  return (await response.json()) as Relation;
}

export async function getRelation(
  workId: number,
  relationId: number,
  signal?: AbortSignal,
): Promise<Relation | null> {
  const response = await fetch(RELATION_API_PATH(workId, relationId), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readRelationError(response));
  }

  return (await response.json()) as Relation;
}

export async function updateRelation(
  workId: number,
  relationId: number,
  payload: UpdateRelationInput,
): Promise<Relation> {
  const response = await fetch(RELATION_API_PATH(workId, relationId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readRelationError(response));
  }

  return (await response.json()) as Relation;
}

export async function deleteRelation(
  workId: number,
  relationId: number,
): Promise<void> {
  const response = await fetch(RELATION_API_PATH(workId, relationId), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readRelationError(response));
  }
}
