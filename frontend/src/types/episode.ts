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
