import WorkWorkspace from "@/components/workspace/WorkWorkspace";

export default async function WorkWorkspacePage({
  params,
}: PageProps<"/works/[workId]">) {
  const { workId } = await params;

  return <WorkWorkspace workId={workId} />;
}
