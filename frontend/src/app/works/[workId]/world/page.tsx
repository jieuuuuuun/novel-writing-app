import WorkWorldPage from "@/components/world/WorkWorldPage";

interface WorldRouteProps {
  params: Promise<{
    workId: string;
  }>;
}

export default async function WorldPage({ params }: WorldRouteProps) {
  const { workId } = await params;

  return <WorkWorldPage workId={workId} />;
}
