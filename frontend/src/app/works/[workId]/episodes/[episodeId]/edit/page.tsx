import EpisodeEditorPage from "@/components/episode/EpisodeEditorPage";

interface EditEpisodePageProps {
  params: Promise<{
    workId: string;
    episodeId: string;
  }>;
}

export default async function EditEpisodePage({
  params,
}: EditEpisodePageProps) {
  const { workId, episodeId } = await params;

  return (
    <EpisodeEditorPage
      workId={workId}
      episodeId={episodeId}
      mode="edit"
    />
  );
}
