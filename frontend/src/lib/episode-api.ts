import type { Episode } from "@/types/episode";

const EPISODE_API_PATH = "/api/episode";

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
