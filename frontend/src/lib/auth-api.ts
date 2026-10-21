import type { AuthUser } from "@/types/auth";

const AUTH_API_PATH = "/api/auth";
export const AUTH_UNAUTHORIZED_EVENT = "glean:auth-unauthorized";

async function readAuthError(response: Response): Promise<string> {
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

export async function getCurrentUser(
  signal?: AbortSignal,
): Promise<AuthUser | null> {
  const response = await fetch(`${AUTH_API_PATH}/me`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readAuthError(response));
  }

  return (await response.json()) as AuthUser;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${AUTH_API_PATH}/logout`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await readAuthError(response));
  }
}

export function getGoogleLoginUrl(): string {
  return `${AUTH_API_PATH}/google`;
}

export function notifyUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  }
}
