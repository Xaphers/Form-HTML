const COOKIE = "nfc_session";
const PUBLIC_ACTIONS = new Set([
  "auth.login",
  "auth.register",
  "public.review.get",
  "public.review.submit"
]);

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  const item = header.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  if (!item) return "";
  try {
    return decodeURIComponent(item.slice(name.length + 1));
  } catch {
    return "";
  }
}

function sendJson(res, status, body, headers = {}) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  return res.send(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 405, { success: false, message: "Method tidak diizinkan." });
  }

  try {
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      return sendJson(res, 500, {
        success: false,
        message: "APPS_SCRIPT_URL belum diatur di Vercel."
      });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const action = body.action;
    const data = body.data && typeof body.data === "object" ? { ...body.data } : {};

    if (typeof action !== "string" || !action) {
      return sendJson(res, 400, { success: false, message: "Action tidak valid." });
    }

    const token = readCookie(req, COOKIE);
    if (!PUBLIC_ACTIONS.has(action)) {
      if (!token) {
        return sendJson(res, 401, {
          success: false,
          message: "Session tidak ditemukan. Silakan login."
        });
      }
      data.token = token;
    }

    const upstream = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, data }),
      redirect: "follow"
    });

    const raw = await upstream.text();
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      throw new Error("Respons Apps Script bukan JSON: " + raw.slice(0, 200));
    }

    const output = { ...result };
    delete output.token;

    if (action === "auth.login" && result.success && result.token) {
      res.setHeader("Set-Cookie",
        COOKIE + "=" + encodeURIComponent(result.token) +
        "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=21600"
      );
    }

    if (action === "auth.logout" && result.success) {
      res.setHeader("Set-Cookie",
        COOKIE + "=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
      );
    }

    return sendJson(res, upstream.ok ? 200 : upstream.status, output);
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan pada server."
    });
  }
};
