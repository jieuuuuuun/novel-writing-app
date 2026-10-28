import CharacterListPage from "@/components/character/CharacterListPage";

interface CharactersPageProps {
  params: Promise<{
    workId: string;
  }>;
}

export default async function CharactersPage({
  params,
}: CharactersPageProps) {
  const { workId } = await params;

  return <CharacterListPage workId={workId} />;
}
