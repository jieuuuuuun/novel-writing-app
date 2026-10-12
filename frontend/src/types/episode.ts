// Episode API에서 받는 회차 데이터의 형태입니다.
export interface Episode {
  id: number;
  workId: number;
  title: string;
  content: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 새 회차 저장 시 POST /episode에 전달하는 필드입니다.
export interface CreateEpisodeInput {
  workId: number;
  title: string;
  content: string;
  sortOrder: number;
}

// 기존 회차 수정 시 변경 가능한 원고와 회차 번호를 전달합니다.
export interface UpdateEpisodeInput {
  title: string;
  content: string;
  sortOrder: number;
}
