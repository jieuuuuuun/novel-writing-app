import RelationSheetPage from "@/components/relation/RelationSheetPage";

interface RelationSheetRouteProps {
  params: Promise<{
    workId: string;
    relationId: string;
  }>;
}

export default async function RelationSheetRoute({
  params,
}: RelationSheetRouteProps) {
  const { workId, relationId } = await params;

  return (
    <RelationSheetPage
      workId={workId}
      relationId={relationId}
      mode="edit"
    />
  );
}
