/* ════════════════════════════════════════════════════════════════════════
   ARCANUM — combined Worker (frontend + Jebadias proxy + usage stats)

   Three jobs in one Worker:
     1. Serves the static app (index.html) via Workers Static Assets.
     2. Proxies chat requests to the Anthropic API (key stays server-side).
     3. Tracks usage — live visitors now + total unique visitors all-time —
        in a single Durable Object (`Stats`), counting anonymous users too.

   Routing:
     • OPTIONS                 → CORS preflight
     • POST /api/presence      → usage heartbeat, returns { live, total }
     • POST (anything else)     → proxied to Anthropic (unchanged advisor behaviour)
     • everything else          → static app via env.ASSETS
     (If there is no ASSETS binding — a bare proxy deploy — non-POST returns 405.)

   ── DEPLOY (single-Worker mode, replaces Netlify) ────────────────────────
   1. npm install -D wrangler@latest
   2. npx wrangler secret put ARCANUM_ANTHROPIC_KEY   ← paste your sk-ant-… key
   3. npx wrangler deploy      (creates the Stats Durable Object automatically)
   4. Point your domain at the `arcanum` worker; verify the advisor + widget.
   See progress.md for the full checklist and the GitHub-connected auto-deploy setup.

   NOTE: deploy with `wrangler deploy` (or Workers Builds from GitHub), NOT the
   dashboard code editor — Static Assets and DO migrations need wrangler.
   ════════════════════════════════════════════════════════════════════════ */

import { DurableObject } from "cloudflare:workers";

const ALLOWED_ORIGINS = [
  "https://arcanum-ec.netlify.app",
  "http://localhost:3000",
  "http://127.0.0.1:5500"
];

// Models the proxy is allowed to bill against. Anything else is forced to this
// default, so no caller can request a pricier model and run up the bill.
const ALLOWED_MODELS = ["claude-sonnet-5"];
const DEFAULT_MODEL = "claude-sonnet-5";

// A visitor counts as "live" for this long after their last heartbeat.
const LIVE_WINDOW_MS = 45000;

// True if the request is cross-origin from a browser we don't allow.
// Same-origin (the app itself) and allow-listed origins pass; requests with no
// Origin header (server-to-server/curl) pass here but are still rate-limited.
function blockedOrigin(origin, url) {
  if (!origin) return false;
  if (origin === url.origin) return false;
  return !ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(origin) {
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

/* ── Usage stats: one global Durable Object counts live + total visitors ──
   `seen` = every unique visitor id ever (all-time total, anonymous included).
   `live` = visitor ids seen within the last LIVE_WINDOW_MS (pruned each ping).
   All writes are synchronous SQL in a single RPC call → atomic, no races,
   and no KV write-quota problem (heartbeats would blow KV's free tier). */
export class Stats extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(
        "CREATE TABLE IF NOT EXISTS seen (vid TEXT PRIMARY KEY, first_seen INTEGER)"
      );
      this.ctx.storage.sql.exec(
        "CREATE TABLE IF NOT EXISTS live (vid TEXT PRIMARY KEY, last_seen INTEGER)"
      );
    });
  }

  // RPC: register a heartbeat for `vid` and return the current counts.
  ping(vid) {
    const now = Date.now();
    const sql = this.ctx.storage.sql;
    if (vid) {
      sql.exec("INSERT OR IGNORE INTO seen (vid, first_seen) VALUES (?, ?)", vid, now);
      sql.exec("INSERT OR REPLACE INTO live (vid, last_seen) VALUES (?, ?)", vid, now);
    }
    sql.exec("DELETE FROM live WHERE last_seen < ?", now - LIVE_WINDOW_MS);
    const total = sql.exec("SELECT COUNT(*) AS n FROM seen").one().n;
    const live = sql.exec("SELECT COUNT(*) AS n FROM live").one().n;
    return { live, total };
  }
}

/* ── Rate limiter: one DO per client IP, fixed-window minute + hour caps.
   Protects the Anthropic bill from flooding without hurting real users. */
export class RateLimiter extends DurableObject {
  async hit() {
    const now = Date.now();
    const st = this.ctx.storage;
    let d = (await st.get("w")) || { minStart: now, min: 0, hrStart: now, hr: 0 };
    if (now - d.minStart >= 60000)   { d.minStart = now; d.min = 0; }
    if (now - d.hrStart  >= 3600000) { d.hrStart  = now; d.hr  = 0; }
    d.min++; d.hr++;
    await st.put("w", d);
    return { allowed: d.min <= 15 && d.hr <= 120, min: d.min, hr: d.hr };
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── Usage stats heartbeat ────────────────────────────────────────────
    if (url.pathname === "/api/presence" && request.method === "POST") {
      if (blockedOrigin(origin, url)) return json({ live: 0, total: 0 }, 403, origin);
      if (!env.STATS) return json({ live: 0, total: 0 }, 200, origin);
      let vid = "";
      try {
        const b = await request.json();
        vid = String((b && b.vid) || "").slice(0, 64);
      } catch (e) { /* ignore bad body — still return counts */ }
      try {
        const stub = env.STATS.getByName("global");
        const res = await stub.ping(vid);
        return json(res, 200, origin);
      } catch (e) {
        return json({ live: 0, total: 0, error: "stats error" }, 200, origin);
      }
    }

    // ── Advisor proxy: forward chat POSTs to Anthropic ───────────────────
    if (request.method === "POST") {
      if (!env.ARCANUM_ANTHROPIC_KEY) {
        return json({ error: "Server missing ARCANUM_ANTHROPIC_KEY secret." }, 500, origin);
      }

      // Reject cross-origin browser abuse (using the proxy as a free Claude endpoint).
      if (blockedOrigin(origin, url)) {
        return json({ error: { type: "forbidden", message: "Requests must come from Arcanum." } }, 403, origin);
      }

      // Rate limit per client IP (flood / bill-abuse protection). Fail open on limiter error.
      if (env.RATELIMIT) {
        try {
          const ip = request.headers.get("cf-connecting-ip") || "anon";
          const rl = await env.RATELIMIT.getByName(ip).hit();
          if (!rl.allowed) {
            return json({ error: { type: "rate_limited", message: "You're sending messages too quickly. Please wait a minute and try again." } }, 429, origin);
          }
        } catch (e) { /* fail open */ }
      }

      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body." }, 400, origin);
      }

      // Input caps — keep any single request bounded and cheap.
      let msgs = Array.isArray(payload.messages) ? payload.messages : [];
      if (msgs.length > 40) msgs = msgs.slice(-40);
      msgs = msgs.map(function (m) {
        return { role: m.role, content: typeof m.content === "string" ? m.content.slice(0, 8000) : m.content };
      });
      const sys = typeof payload.system === "string" ? payload.system.slice(0, 20000) : payload.system;

      const body = {
        model: ALLOWED_MODELS.includes(payload.model) ? payload.model : DEFAULT_MODEL,
        max_tokens: Math.min(payload.max_tokens || 1000, 1500),
        messages: msgs,
      };
      if (sys) body.system = sys;
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
        return json(data, upstream.status, origin);
      } catch (e) {
        return json({ error: "Upstream request failed.", detail: String(e) }, 502, origin);
      }
    }

    // ── Frontend: serve the static app ───────────────────────────────────
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // Bare proxy deploy with no assets binding → old behaviour.
    return json({ error: "Method not allowed. Use POST." }, 405, origin);
  }
};
