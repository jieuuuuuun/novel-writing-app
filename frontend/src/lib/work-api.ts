import type {
  CreateWorkInput,
  UpdateWorkInput,
  Work,
} from "@/types/work";

const WORK_API_PATH = "/api/work";

// 백엔드 오류 응답 형식이 달라도 사용자에게 전달할 메시지로 정리합니다.
async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
    };

    if (Array.isArray(body.message)) {
      return body.message.join(", ");
    }

    return body.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

// 작품 목록을 항상 최신 상태로 조회하며, 필요하면 호출 측에서 요청을 취소할 수 있습니다.
export async function getWorks(signal?: AbortSignal): Promise<Work[]> {
  const response = await fetch(WORK_API_PATH, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as Work[];
}

// 작품 ID로 워크스페이스에 표시할 작품 하나를 조회합니다.
export async function getWork(
  workId: number,
  signal?: AbortSignal,
): Promise<Work | null> {
  const response = await fetch(`${WORK_API_PATH}/${workId}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as Work | null;
}

// 새 작품을 등록하고 백엔드가 생성한 전체 Work 데이터를 반환합니다.
export async function postWork(input: CreateWorkInput): Promise<Work> {
  // 인증 연동 전까지 현재 사용자를 대신할 임시 ID를 환경변수로 받습니다.
  const configuredUserId = Number(
    process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "1",
  );

  if (!Number.isInteger(configuredUserId) || configuredUserId < 1) {
    throw new Error("NEXT_PUBLIC_DEMO_USER_ID must be a positive integer.");
  }

  const response = await fetch(WORK_API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title,
      subtitle: input.subtitle || undefined,
      userId: configuredUserId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as Work;
}

// 작품 제목과 부제를 수정하고 서버가 갱신한 Work를 반환합니다.
export async function patchWork(
  workId: number,
  input: UpdateWorkInput,
): Promise<Work> {
  const response = await fetch(`${WORK_API_PATH}/${workId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as Work;
}

// 작품과 cascade 관계의 회차를 함께 삭제합니다.
export async function deleteWork(workId: number): Promise<void> {
  const response = await fetch(`${WORK_API_PATH}/${workId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
