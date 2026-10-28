import { notifyUnauthorized } from "@/lib/auth-api";
import type { Planning, UpdatePlanningInput } from "@/types/planning";

const PLANNING_API_PATH = (workId: number) =>
  `/api/work/${workId}/planning`;

async function readPlanningError(response: Response): Promise<string> {
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

export async function getPlanning(
  workId: number,
  signal?: AbortSignal,
): Promise<Planning | null> {
  const response = await fetch(PLANNING_API_PATH(workId), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readPlanningError(response));
  }

  return (await response.json()) as Planning;
}

export async function updatePlanning(
  workId: number,
  input: UpdatePlanningInput,
): Promise<Planning> {
  const response = await fetch(PLANNING_API_PATH(workId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readPlanningError(response));
  }

  return (await response.json()) as Planning;
}
