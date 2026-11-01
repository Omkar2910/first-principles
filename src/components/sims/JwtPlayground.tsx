"use client";

import { useEffect, useState } from "react";
import { SimFrame } from "./ui";

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = (s: string) => b64url(new TextEncoder().encode(s));

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}

const SERVER_SECRET = "server-side-secret-never-sent";
const HEADER = JSON.stringify({ alg: "HS256", typ: "JWT" });
const ORIGINAL = JSON.stringify({ sub: "user_42", role: "customer", exp: 1893456000 }, null, 0);

export function JwtPlayground() {
  const [payload, setPayload] = useState(ORIGINAL);
  const [issuedSig, setIssuedSig] = useState("");
  const [validSig, setValidSig] = useState("");

  // Signature the server issued at login for the original payload.
  useEffect(() => {
    hmac(SERVER_SECRET, `${enc(HEADER)}.${enc(ORIGINAL)}`).then(setIssuedSig);
  }, []);
  // What the server computes when it verifies the (possibly edited) token.
  useEffect(() => {
    hmac(SERVER_SECRET, `${enc(HEADER)}.${enc(payload)}`).then(setValidSig);
  }, [payload]);

  const ok = issuedSig && issuedSig === validSig;

  return (
    <SimFrame
      title="JWT tamper test"
      hint="This token was signed by the server at login. You're the client: edit the payload (try changing role to admin) and see what the server concludes."
    >
      <label className="mb-1 block text-sm font-medium">Payload (base64-encoded, not encrypted: anyone can read and edit it)</label>
      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-800"
      />
      <button onClick={() => setPayload(ORIGINAL)} className="mt-1 text-xs text-slate-500 underline">
        Reset payload
      </button>

      <div className="mt-4 break-all rounded-lg bg-slate-50 p-3 font-mono text-[11px] leading-relaxed dark:bg-slate-800/60">
        <span className="text-rose-600">{enc(HEADER)}</span>.<span className="text-violet-600 dark:text-violet-400">{enc(payload)}</span>.
        <span className="text-sky-600">{issuedSig}</span>
      </div>
      <div className="mt-1 flex gap-4 text-[11px] text-slate-500">
        <span className="text-rose-600">header</span>
        <span className="text-violet-600 dark:text-violet-400">payload</span>
        <span className="text-sky-600">signature (from login)</span>
      </div>

      <div className={`mt-4 rounded-lg p-3 text-sm ${ok ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-rose-100 dark:bg-rose-500/15"}`}>
        <b>Server verification:</b>{" "}
        {ok
          ? "HMAC(secret, header.payload) matches the signature → token accepted."
          : "Recomputed signature doesn't match → 401. Without the server's secret you can't produce a valid signature for the edited payload."}
        <div className="mt-1 break-all font-mono text-[11px] opacity-70">expected: {validSig}</div>
      </div>
    </SimFrame>
  );
}
