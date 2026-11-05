import WorkSynopsisPage from "@/components/synopsis/WorkSynopsisPage";

interface SynopsisRouteProps {
  params: Promise<{
    workId: string;
  }>;
}

export default async function SynopsisPage({ params }: SynopsisRouteProps) {
  const { workId } = await params;

  return <WorkSynopsisPage workId={workId} />;
}
