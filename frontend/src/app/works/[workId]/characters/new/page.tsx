import CharacterSheetPage from "@/components/character/CharacterSheetPage";

interface NewCharacterPageProps {
  params: Promise<{
    workId: string;
  }>;
}

export default async function NewCharacterPage({
  params,
}: NewCharacterPageProps) {
  const { workId } = await params;

  return <CharacterSheetPage workId={workId} mode="create" />;
}
