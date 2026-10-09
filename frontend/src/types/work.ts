// 조회·등록 응답으로 받는 서버의 완전한 작품 데이터입니다.
export interface Work {
  id: number;
  userId: number;
  title: string;
  subtitle: string | null;
  createdAt: string;
  updatedAt: string;
}

// 새 작품 등록 시 사용자가 입력하는 필드만 담는 요청용 타입입니다.
export interface CreateWorkInput {
  title: string;
  subtitle?: string;
}
