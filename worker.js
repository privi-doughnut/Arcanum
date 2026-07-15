/* ════════════════════════════════════════════════════════════════════════
   ARCANUM — Jebadias API proxy (Cloudflare Worker)
   Its only job: hold the Anthropic API key server-side and forward chat
   requests to the Anthropic API. The key never touches the browser or repo.

   SETUP (one time):
   1. Cloudflare dashboard → Workers & Pages → your `arcanum-api-proxy` worker
      → Edit code → paste this whole file → Deploy.
   2. Same worker → Settings → Variables and Secrets → add a SECRET:
        Name:  ARCANUM_ANTHROPIC_KEY
        Value: your Anthropic key (starts with sk-ant-...)
      Save, then Deploy again so the secret is picked up.
   That's it. The app already points at this worker's URL.
   ════════════════════════════════════════════════════════════════════════ */

const ALLOWED_ORIGINS = [
  "https://arcanum-ec.netlify.app",
  "http://localhost:3000",
  "http://127.0.0.1:5500"
];

function corsHeaders(origin) {
  // Echo the request origin if it's known; otherwise allow all (the key is
  // server-side, so a permissive proxy is safe — anyone could POST anyway).
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed. Use POST." }, 405, origin);
    }

    if (!env.ARCANUM_ANTHROPIC_KEY) {
      return json({ error: "Server missing ARCANUM_ANTHROPIC_KEY secret." }, 500, origin);
    }

    // Parse the client body
    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return json({ error: "Invalid JSON body." }, 400, origin);
    }

    // Build the Anthropic request, with sane defaults if fields are missing
    const body = {
      model: payload.model || "claude-sonnet-5",
      max_tokens: payload.max_tokens || 1000,
      messages: payload.messages || [],
    };
    if (payload.system) body.system = payload.system;
    if (payload.temperature != null) body.temperature = payload.temperature;

    try {
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ARCANUM_ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(body)
      });

      const data = await upstream.json();

      // Pass the Anthropic status straight through (so the client sees real
      // errors like 401/400 instead of an opaque failure), plus CORS headers.
      return json(data, upstream.status, origin);
    } catch (e) {
      return json({ error: "Upstream request failed.", detail: String(e) }, 502, origin);
    }
  }
};
