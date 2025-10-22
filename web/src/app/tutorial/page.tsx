export default function TutorialPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">Mortar Game Tutorial</h1>
      <p className="text-sm text-gray-600 mb-6">Quick, practical tips for controls, ammo, and reading the HUD. If anything in your build differs, tell me and I’ll adjust.</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Controls (Cheat‑sheet)</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Fire: Left mouse button.</li>
          <li>Zoom (scope): Right mouse button to toggle zoom. Use mouse wheel to fine‑adjust zoom level.</li>
          <li>Ammo selection:
            <ul className="list-disc ml-6">
              <li>1 → HE (High Explosive) — standard blast.</li>
              <li>2 → HE+ — stronger blast radius/damage.</li>
              <li>3 → Smoke — obscures vision, useful for concealment or streak rewards.</li>
            </ul>
          </li>
          <li>Pointer lock: Press Esc to release the mouse if it’s captured inside the canvas.</li>
          <li>Name: You can change your player name at any time above the canvas on the Game page.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Reading the HUD</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li><span className="font-semibold">Range</span>: Predicted distance to target (e.g., “pred 87 m; max 92 m”). Use this to estimate how far you need to lob.</li>
          <li><span className="font-semibold">Elev</span>: Elevation angle of the mortar. Higher elevation → longer time‑of‑flight and arc.</li>
          <li><span className="font-semibold">Δ to target</span>: The delta between your current aim solution and the target distance. Positive Δ means you’ll overshoot; negative Δ means you’ll fall short. Adjust elevation until Δ is near 0 for best accuracy.</li>
          <li><span className="font-semibold">Ammo status</span>: Displays the active ammo and counts: [HE:• | Smoke:• | HE+:•]. Switch with 1/2/3.</li>
          <li><span className="font-semibold">Score / Streak</span>: Correct quiz answers increase streak; misses reset it. Higher streaks unlock rewards (e.g., Smoke at ≥5).</li>
          <li><span className="font-semibold">Timer</span>: The demo timer appears at the top‑right. When it reaches 0:00, your final score is posted to the leaderboard automatically.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Aiming Tips</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Dial in elevation slowly while watching <span className="font-semibold">Δ to target</span>. Aim for Δ ≈ 0 before firing.</li>
          <li>Use <span className="font-semibold">zoom</span> (right mouse) to confirm target identity and alignment. Zoom out to reacquire the scene after recoil or explosion effects.</li>
          <li>The <span className="font-semibold">outliner</span> effect helps you re‑acquire the target after smoke or debris—if available in your build.</li>
          <li>Start with HE to verify range; switch to HE+ when you need extra punch; use Smoke tactically to block enemy vision or to meet mission objectives.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Leaderboard & Attempts</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Each submit posts a single <span className="font-semibold">attempt</span>: the latest attempt overwrites your previous score.</li>
          <li>Your final score is auto‑submitted when the demo timer ends.</li>
          <li>Open the leaderboard anytime to compare results live.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-600 mb-4">Need different bindings or want extra tips? Message me with your preferred keys or gameplay specifics and I’ll tailor this page.</p>

      <div className="mt-6 flex items-center gap-3">
        <a href="/game" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Play the Demo</a>
        <a href="/leaderboard" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">View Leaderboard</a>
      </div>
    </main>
  );
}