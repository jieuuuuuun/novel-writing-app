import { redirect } from "next/navigation";

export default async function EpisodesPage({
  params,
}: PageProps<"/works/[workId]/episodes">) {
  const { workId } = await params;

  // 회차 관리 화면이 완성되기 전까지 작품 홈의 최근 회차 영역으로 안내합니다.
  redirect(`/works/${workId}#recent-episodes`);
}
