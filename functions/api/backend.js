const COOKIE = "nfc_session";
const PUBLIC_ACTIONS = new Set(["auth.login","auth.register","public.review.get","public.review.submit"]);
const ME_TTL = 120000;
const meCache = new Map();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });
}
function cookieValue(request, name) {
  const raw = request.headers.get("Cookie") || "";
  const item = raw.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}
export async function onRequestPost({ request, env }) {
  try {
    if (!env.APPS_SCRIPT_URL) return json({ success:false, message:"APPS_SCRIPT_URL belum diatur di Cloudflare." },500);
    const body = await request.json();
    const action = body?.action;
    const data = body?.data && typeof body.data === "object" ? body.data : {};
    if (typeof action !== "string" || !action) return json({ success:false,message:"Action tidak valid." },400);
    const token = cookieValue(request, COOKIE);
    if (!PUBLIC_ACTIONS.has(action)) {
      if (!token) return json({ success:false,message:"Session tidak ditemukan. Silakan login." },401);
      data.token = token;
      if (action === "auth.me") {
        const cached = meCache.get(token);
        if (cached && Date.now() - cached.at < ME_TTL) return json(cached.body);
      }
    }
    const upstream = await fetch(env.APPS_SCRIPT_URL, {
      method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({action,data}), redirect:"follow"
    });
    const raw = await upstream.text();
    let result;
    try { result = JSON.parse(raw); } catch { throw new Error("Respons Apps Script bukan JSON: " + raw.slice(0,200)); }
    const output = { ...result }; delete output.token;
    const headers = {};
    if (action === "auth.login" && result.success && result.token) {
      headers["Set-Cookie"] = COOKIE + "=" + encodeURIComponent(result.token) + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=21600";
    }
    if (action === "auth.logout" && result.success) {
      headers["Set-Cookie"] = COOKIE + "=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
      meCache.delete(token);
    }
    if (action === "auth.me" && result.success && token) meCache.set(token,{at:Date.now(),body:output});
    return json(output, upstream.ok ? 200 : upstream.status, headers);
  } catch (error) {
    return json({ success:false, message:error instanceof Error ? error.message : "Terjadi kesalahan pada server." },500);
  }
}
export async function onRequest({ request, next }) {
  if (request.method === "OPTIONS") return new Response(null,{status:204,headers:{ "Allow":"POST, OPTIONS" }});
  return next();
}