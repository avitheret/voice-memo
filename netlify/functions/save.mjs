import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const DB_KEY = "MAIN";

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: CORS });

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const text = (body.text || "").trim();
  if (!text)
    return new Response(JSON.stringify({ error: "No text provided" }), { status: 400, headers: CORS });

  const store = getStore("voice-memos");
  const raw   = await store.get(DB_KEY).catch(() => null);

  let current;
  try {
    const parsed = JSON.parse(raw ?? "null");
    if (Array.isArray(parsed)) current = { memos: parsed, folders: [], savedAt: 0 };
    else current = parsed ?? { memos: [], folders: [], savedAt: 0 };
    current.folders = current.folders ?? [];
  } catch {
    current = { memos: [], folders: [], savedAt: 0 };
  }

  // Optional: save to a named folder
  const folderName = (body.folder || "").trim();
  const folder = folderName
    ? current.folders.find(f => f.name.toLowerCase() === folderName.toLowerCase())
    : null;

  const memo = {
    id:       Date.now(),
    text,
    duration: 0,
    date:     new Date().toISOString(),
    lang:     body.lang || "en-US",
    folderId: folder?.id ?? null,
  };

  current.memos.unshift(memo);
  current.savedAt = Date.now();
  await store.set(DB_KEY, JSON.stringify(current));

  return new Response(JSON.stringify({ ok: true, id: memo.id }), { headers: CORS });
};

export const config = { path: "/api/save" };
