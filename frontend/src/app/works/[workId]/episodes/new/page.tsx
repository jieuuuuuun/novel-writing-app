import { redirect } from "next/navigation";

export default async function NewEpisodePage({
  params,
}: PageProps<"/works/[workId]/episodes/new">) {
  const { workId } = await params;

  // 새 회차 에디터가 완성되기 전까지 현재 작품의 회차 영역으로 안내합니다.
  redirect(`/works/${workId}#recent-episodes`);
}
