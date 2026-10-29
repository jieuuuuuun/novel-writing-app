import RelationSheetPage from "@/components/relation/RelationSheetPage";

interface NewRelationPageProps {
  params: Promise<{
    workId: string;
  }>;
}

export default async function NewRelationPage({
  params,
}: NewRelationPageProps) {
  const { workId } = await params;

  return <RelationSheetPage workId={workId} mode="create" />;
}
