import PlayerList from "@/components/PlayerList";

const lists = [
  {
    title: "LISTA INICIAÇÃO",
    players: ["Porto", "João", "Blake", "K1", "Zanin"],
  },
  {
    title: "LISTA - 01",
    players: ["Porto", "Zanin", "Rox", "Ffpx", "Pedrin"],
  },
  {
    title: "LISTA - 02",
    players: ["F.Mid", "Lunatic", "Porto", "Vega", "Santi", "Gus", "And"],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border py-8 text-center">
        <h1 className="text-4xl font-black tracking-widest uppercase text-primary drop-shadow-[0_0_15px_hsl(142_70%_45%/0.4)]">
          ⚔ Campeonato
        </h1>
        <p className="mt-2 text-muted-foreground tracking-wide text-sm uppercase">
          Organização de Times
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {lists.map((list) => (
          <PlayerList key={list.title} title={list.title} players={list.players} />
        ))}
      </main>
    </div>
  );
};

export default Index;
