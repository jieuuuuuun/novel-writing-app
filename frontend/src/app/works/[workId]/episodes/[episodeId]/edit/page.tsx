import EpisodeEditorPage from "@/components/episode/EpisodeEditorPage";

export default async function EditEpisodePage({
  params,
}: PageProps<"/works/[workId]/episodes/[episodeId]/edit">) {
  const { workId, episodeId } = await params;

  return (
    <EpisodeEditorPage
      workId={workId}
      episodeId={episodeId}
      mode="edit"
    />
  );
}
