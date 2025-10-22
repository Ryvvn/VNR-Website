import Leaderboard from "@/components/Leaderboard";

export const dynamic = "force-dynamic"; // ensure fresh data

export default function LeaderboardPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Game Leaderboard</h1>
      <Leaderboard />
    </main>
  );
}