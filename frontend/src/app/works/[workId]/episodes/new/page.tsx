import EpisodeEditorPage from "@/components/episode/EpisodeEditorPage";

interface NewEpisodePageProps {
  params: Promise<{
    workId: string;
  }>;
}

export default async function NewEpisodePage({
  params,
}: NewEpisodePageProps) {
  const { workId } = await params;

  return <EpisodeEditorPage workId={workId} />;
}
