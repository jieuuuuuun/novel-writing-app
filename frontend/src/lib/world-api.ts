import { notifyUnauthorized } from "@/lib/auth-api";
import type {
  UpdateWorldSettingInput,
  WorldSetting,
} from "@/types/world";

const WORLD_API_PATH = (workId: number) => `/api/work/${workId}/world`;

async function readWorldError(response: Response): Promise<string> {
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

export async function getWorldSetting(
  workId: number,
  signal?: AbortSignal,
): Promise<WorldSetting | null> {
  const response = await fetch(WORLD_API_PATH(workId), {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readWorldError(response));
  }

  return (await response.json()) as WorldSetting;
}

export async function updateWorldSetting(
  workId: number,
  payload: UpdateWorldSettingInput,
): Promise<WorldSetting> {
  const response = await fetch(WORLD_API_PATH(workId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readWorldError(response));
  }

  return (await response.json()) as WorldSetting;
}
