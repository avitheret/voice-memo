import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export default async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const store = getStore("voice-memos");

  // GET /api/memos?code=XXXX  — load memos for a sync code
  if (req.method === "GET") {
    const code = new URL(req.url).searchParams.get("code")?.toUpperCase().trim();
    if (!code) return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: CORS });

    const raw = await store.get(code).catch(() => null);
    return new Response(raw ?? "[]", { headers: CORS });
  }

  // POST /api/memos  — save memos for a sync code
  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
    }
    const code = body.code?.toUpperCase().trim();
    if (!code) return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: CORS });

    await store.set(code, JSON.stringify(body.memos ?? []));
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS });
};

export const config = { path: "/api/memos" };
