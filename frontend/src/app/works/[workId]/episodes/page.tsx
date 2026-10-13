import EpisodeListPage from "@/components/episode/EpisodeListPage";

interface EpisodesPageProps {
  params: Promise<{
    workId: string;
  }>;
}

export default async function EpisodesPage({
  params,
}: EpisodesPageProps) {
  const { workId } = await params;

  return <EpisodeListPage workId={workId} />;
}
