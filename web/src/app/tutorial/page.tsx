export default function TutorialPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">Mortar Game Tutorial</h1>
      <p className="text-sm text-gray-600 mb-6">A quick guide to controls and objectives. If something differs in your build, let me know and I’ll adjust the page.</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Basic Controls</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Aim: Move your mouse to aim the mortar.</li>
          <li>Zoom: Use your mouse wheel to zoom in/out (if supported).</li>
          <li>Ammo Selection: Use the on-screen UI or number keys to change ammo type.</li>
          <li>Fire: Left mouse button to fire.</li>
          <li>Camera: Toggle follow/overview with the on-screen controls (may vary by build).</li>
          <li>Pointer Lock: Press Esc to release the mouse capture if needed.</li>
          <li>Autoplay: Press G (or use the UI) to stop autoplay if enabled.</li>
          <li>Quiz: Open/Close the quiz with the on-screen button; answer questions to earn streak rewards.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Scoring & Streaks</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Each correct quiz answer increases your streak; a wrong answer resets it.</li>
          <li>Higher streaks grant rewards (e.g., smoke once at streak ≥ 5).</li>
          <li>Your leaderboard score updates per attempt (latest attempt overwrites the previous).</li>
          <li>When demo time ends, your final total score is posted automatically.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Objectives</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Engage targets efficiently: aim carefully and choose the right ammo.</li>
          <li>Use the quiz to improve your streak and unlock rewards.</li>
          <li>Keep an eye on the demo timer (top-right). Plan your shots to maximize points.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Tips</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>If the mouse seems locked in the canvas, press Esc to release it.</li>
          <li>You can update your player name anytime using the input above the canvas on the Game page.</li>
          <li>View the live leaderboard at any time to see the top scores.</li>
        </ul>
      </section>

      <div className="mt-6 flex items-center gap-3">
        <a href="/game" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Play the Demo</a>
        <a href="/leaderboard" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">View Leaderboard</a>
      </div>
    </main>
  );
}