import WorkPlanningPage from "@/components/planning/WorkPlanningPage";

interface PlanningRouteProps {
  params: Promise<{
    workId: string;
  }>;
}

export default async function PlanningPage({
  params,
}: PlanningRouteProps) {
  const { workId } = await params;

  return <WorkPlanningPage workId={workId} />;
}
