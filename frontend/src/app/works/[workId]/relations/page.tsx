import RelationListPage from "@/components/relation/RelationListPage";

interface RelationsPageProps {
  params: Promise<{
    workId: string;
  }>;
}

export default async function RelationsPage({
  params,
}: RelationsPageProps) {
  const { workId } = await params;

  return <RelationListPage workId={workId} />;
}
