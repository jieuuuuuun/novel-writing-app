import EpisodeListPage from "@/components/episode/EpisodeListPage";

export default async function EpisodesPage({
  params,
}: PageProps<"/works/[workId]/episodes">) {
  const { workId } = await params;

  return <EpisodeListPage workId={workId} />;
}
