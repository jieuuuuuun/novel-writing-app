import CharacterSheetPage from "@/components/character/CharacterSheetPage";

interface CharacterSheetRouteProps {
  params: Promise<{
    workId: string;
    characterId: string;
  }>;
}

export default async function CharacterSheetRoute({
  params,
}: CharacterSheetRouteProps) {
  const { workId, characterId } = await params;

  return (
    <CharacterSheetPage
      workId={workId}
      characterId={characterId}
      mode="edit"
    />
  );
}
