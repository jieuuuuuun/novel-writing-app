import type {
  CreateEpisodeInput,
  Episode,
  UpdateEpisodeInput,
} from "@/types/episode";

const EPISODE_API_PATH = "/api/episode";

async function readEpisodeError(response: Response): Promise<string> {
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

// 현재 API는 전체 회차만 제공하므로 frontend에서 작품 ID가 같은 회차만 골라냅니다.
export async function getEpisodesByWork(
  workId: number,
  signal?: AbortSignal,
): Promise<Episode[]> {
  const response = await fetch(EPISODE_API_PATH, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const episodes = (await response.json()) as Episode[];
  return episodes.filter((episode) => episode.workId === workId);
}

// 회차 ID로 수정 화면에 표시할 기존 원고 하나를 조회합니다.
export async function getEpisode(
  episodeId: number,
  signal?: AbortSignal,
): Promise<Episode | null> {
  const response = await fetch(`${EPISODE_API_PATH}/${episodeId}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readEpisodeError(response));
  }

  const body = await response.text();
  return body ? (JSON.parse(body) as Episode) : null;
}

// 입력한 원고를 새 회차로 저장하고 생성된 Episode를 반환합니다.
export async function postEpisode(
  input: CreateEpisodeInput,
): Promise<Episode> {
  const response = await fetch(EPISODE_API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readEpisodeError(response));
  }

  return (await response.json()) as Episode;
}

// 제목, 본문, 회차 번호를 수정하고 서버가 갱신한 Episode를 반환합니다.
export async function patchEpisode(
  episodeId: number,
  input: UpdateEpisodeInput,
): Promise<Episode> {
  const response = await fetch(`${EPISODE_API_PATH}/${episodeId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readEpisodeError(response));
  }

  return (await response.json()) as Episode;
}

// 회차 목록에서 선택한 원고를 삭제합니다.
export async function deleteEpisode(episodeId: number): Promise<void> {
  const response = await fetch(`${EPISODE_API_PATH}/${episodeId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readEpisodeError(response));
  }
}
