import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const store = getStore("voice-memos");

  // GET /api/memos?code=XXXX
  if (req.method === "GET") {
    const code = new URL(req.url).searchParams.get("code")?.toUpperCase().trim();
    if (!code) return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: CORS });

    const raw = await store.get(code).catch(() => null);

    // Support legacy plain-array format and current { memos, folders, savedAt }
    let payload;
    try {
      const parsed = JSON.parse(raw ?? "null");
      if (Array.isArray(parsed)) {
        payload = { memos: parsed, folders: [], savedAt: 0 };   // legacy
      } else {
        payload = parsed ?? { memos: [], folders: [], savedAt: 0 };
        payload.folders = payload.folders ?? [];
      }
    } catch {
      payload = { memos: [], folders: [], savedAt: 0 };
    }

    return new Response(JSON.stringify(payload), { headers: CORS });
  }

  // POST /api/memos  { code, memos, savedAt }
  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
    }
    const code = body.code?.toUpperCase().trim();
    if (!code) return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: CORS });

    await store.set(code, JSON.stringify({
      memos:   body.memos   ?? [],
      folders: body.folders ?? [],
      savedAt: body.savedAt ?? Date.now(),
    }));
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS });
};

export const config = { path: "/api/memos" };
