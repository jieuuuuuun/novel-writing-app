import EpisodeEditorPage from "@/components/episode/EpisodeEditorPage";

export default async function NewEpisodePage({
  params,
}: PageProps<"/works/[workId]/episodes/new">) {
  const { workId } = await params;

  return <EpisodeEditorPage workId={workId} />;
}
