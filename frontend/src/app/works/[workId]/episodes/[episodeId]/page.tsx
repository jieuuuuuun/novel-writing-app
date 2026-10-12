import EpisodeDetailPage from "@/components/episode/EpisodeDetailPage";

export default async function EpisodeDetailRoute({
  params,
}: PageProps<"/works/[workId]/episodes/[episodeId]">) {
  const { workId, episodeId } = await params;

  return (
    <EpisodeDetailPage
      workId={workId}
      episodeId={episodeId}
    />
  );
}
