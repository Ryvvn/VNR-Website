import { readLeaderboard } from "../_store";
import { addClient, removeClient } from "../_sse";

export const runtime = "nodejs"; // ensure Node runtime for WritableStream

export async function GET(req: Request) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Register client
  addClient(writer);

  // Send the current leaderboard immediately
  const initial = readLeaderboard();
  try {
    const enc = new TextEncoder();
    const msg = `event: leaderboard\n` + `data: ${JSON.stringify(initial)}\n\n`;
    writer.write(enc.encode(msg));
  } catch {}

  // Keep connection alive with comments every 20 seconds
  const keepAlive = setInterval(() => {
    try {
      const enc = new TextEncoder();
      writer.write(enc.encode(`: keepalive ${Date.now()}\n\n`));
    } catch {}
  }, 20000);

  // Cleanup on client abort
  const onAbort = () => {
    clearInterval(keepAlive);
    removeClient(writer);
  };
  try {
    req.signal?.addEventListener("abort", onAbort);
  } catch {}

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}