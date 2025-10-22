type Writer = WritableStreamDefaultWriter<Uint8Array>;

const clients = new Set<Writer>();
const encoder = new TextEncoder();

export function addClient(writer: Writer) {
  clients.add(writer);
  try {
    writer.write(encoder.encode(`: connected\n\n`));
  } catch {}
}

export function removeClient(writer: Writer) {
  if (clients.has(writer)) {
    clients.delete(writer);
    try { writer.close(); } catch {}
  }
}

export function broadcast<T>(event: string, data: T) {
  const payload = typeof data === "string" ? data : JSON.stringify(data as unknown as Record<string, unknown>);
  const msg = `event: ${event}\n` + `data: ${payload}\n\n`;
  for (const w of Array.from(clients)) {
    try {
      w.write(encoder.encode(msg));
    } catch (e) {
      // Remove dead client
      clients.delete(w);
      try { w.close(); } catch {}
    }
  }
}