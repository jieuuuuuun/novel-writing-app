import { notifyUnauthorized } from "@/lib/auth-api";
import type {
  CreateSynopsisInput,
  SynopsisCurrentIdResponse,
  SynopsisCurrentResponse,
  SynopsisDeleteResponse,
  SynopsisDetail,
  SynopsisListResponse,
  UpdateSynopsisInput,
} from "@/types/synopsis";

const SYNOPSES_API_PATH = (workId: number) =>
  `/api/work/${workId}/synopses`;

const SYNOPSIS_API_PATH = (workId: number, synopsisId: number) =>
  `/api/work/${workId}/synopses/${synopsisId}`;

async function readSynopsisError(response: Response): Promise<string> {
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

export async function getSynopses(
  workId: number,
  signal?: AbortSignal,
): Promise<SynopsisListResponse | null> {
  const response = await fetch(SYNOPSES_API_PATH(workId), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readSynopsisError(response));
  }

  return (await response.json()) as SynopsisListResponse;
}

export async function getSynopsis(
  workId: number,
  synopsisId: number,
  signal?: AbortSignal,
): Promise<SynopsisDetail | null> {
  const response = await fetch(SYNOPSIS_API_PATH(workId, synopsisId), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readSynopsisError(response));
  }

  return (await response.json()) as SynopsisDetail;
}

export async function getCurrentSynopsis(
  workId: number,
  signal?: AbortSignal,
): Promise<SynopsisCurrentResponse | null> {
  const response = await fetch(`${SYNOPSES_API_PATH(workId)}/current`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readSynopsisError(response));
  }

  return (await response.json()) as SynopsisCurrentResponse;
}

export async function createSynopsis(
  workId: number,
  payload: CreateSynopsisInput = {},
): Promise<SynopsisDetail> {
  const response = await fetch(SYNOPSES_API_PATH(workId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readSynopsisError(response));
  }

  return (await response.json()) as SynopsisDetail;
}

export async function updateSynopsis(
  workId: number,
  synopsisId: number,
  payload: UpdateSynopsisInput,
): Promise<SynopsisDetail> {
  const response = await fetch(SYNOPSIS_API_PATH(workId, synopsisId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readSynopsisError(response));
  }

  return (await response.json()) as SynopsisDetail;
}

export async function duplicateSynopsis(
  workId: number,
  synopsisId: number,
  payload: CreateSynopsisInput = {},
): Promise<SynopsisDetail> {
  const response = await fetch(
    `${SYNOPSIS_API_PATH(workId, synopsisId)}/duplicate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readSynopsisError(response));
  }

  return (await response.json()) as SynopsisDetail;
}

export async function setCurrentSynopsis(
  workId: number,
  synopsisId: number,
): Promise<SynopsisCurrentIdResponse> {
  const response = await fetch(
    `${SYNOPSIS_API_PATH(workId, synopsisId)}/current`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(await readSynopsisError(response));
  }

  return (await response.json()) as SynopsisCurrentIdResponse;
}

export async function deleteSynopsis(
  workId: number,
  synopsisId: number,
): Promise<SynopsisDeleteResponse> {
  const response = await fetch(SYNOPSIS_API_PATH(workId, synopsisId), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readSynopsisError(response));
  }

  return (await response.json()) as SynopsisDeleteResponse;
}
