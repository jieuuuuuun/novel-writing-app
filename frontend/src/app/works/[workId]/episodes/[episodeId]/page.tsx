import EpisodeDetailPage from "@/components/episode/EpisodeDetailPage";

interface EpisodeDetailRouteProps {
  params: Promise<{
    workId: string;
    episodeId: string;
  }>;
}

export default async function EpisodeDetailRoute({
  params,
}: EpisodeDetailRouteProps) {
  const { workId, episodeId } = await params;

  return (
    <EpisodeDetailPage
      workId={workId}
      episodeId={episodeId}
    />
  );
}
