"use client";

import { useEffect, useRef, useState } from "react";
import { Button, SimFrame, Slider, Stat } from "./ui";

export function TokenBucketSim() {
  const [capacity, setCapacity] = useState(10);
  const [refill, setRefill] = useState(2); // tokens per second
  const [autoRate, setAutoRate] = useState(0); // requests per second
  const [tokens, setTokens] = useState(10);
  const [log, setLog] = useState<boolean[]>([]);
  const tokensRef = useRef(10);
  const carry = useRef(0);

  const request = () => {
    const ok = tokensRef.current >= 1;
    if (ok) tokensRef.current -= 1;
    setTokens(tokensRef.current);
    setLog((l) => [...l.slice(-59), ok]);
  };

  useEffect(() => {
    const t = setInterval(() => {
      tokensRef.current = Math.min(capacity, tokensRef.current + refill / 10);
      carry.current += autoRate / 10;
      while (carry.current >= 1) {
        carry.current -= 1;
        request();
      }
      setTokens(tokensRef.current);
    }, 100);
    return () => clearInterval(t);
  }, [capacity, refill, autoRate]);

  const accepted = log.filter(Boolean).length;

  return (
    <SimFrame title="Token bucket rate limiter" hint="The bucket refills at a steady rate up to its capacity. Each request spends one token; with no tokens, it gets 429.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Bucket capacity (burst)" value={capacity} min={1} max={20} onChange={(v) => { setCapacity(v); tokensRef.current = Math.min(tokensRef.current, v); }} />
        <Slider label="Refill rate" value={refill} min={0.5} max={10} step={0.5} unit=" tok/s" onChange={setRefill} />
        <Slider label="Steady client traffic" value={autoRate} min={0} max={10} step={0.5} unit=" req/s" onChange={setAutoRate} />
      </div>

      <div className="mt-5 flex items-end gap-6">
        <div className="relative h-40 w-24 overflow-hidden rounded-b-2xl border-2 border-t-0 border-ink-400 dark:border-ink-500">
          <div className="absolute bottom-0 w-full bg-sky-400/80 transition-all duration-100" style={{ height: `${(tokens / capacity) * 100}%` }} />
          <div className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold">{tokens.toFixed(1)}</div>
        </div>
        <div className="flex flex-col gap-2">
          <Button primary onClick={request}>Send 1 request</Button>
          <Button onClick={() => { for (let i = 0; i < 8; i++) request(); }}>Burst of 8</Button>
          <Button onClick={() => { setLog([]); tokensRef.current = capacity; setTokens(capacity); }}>Reset</Button>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1 text-xs text-ink-500">Last 60 requests (green = 200 OK, red = 429 Too Many Requests)</div>
        <div className="flex flex-wrap gap-0.5">
          {log.map((ok, i) => (
            <span key={i} className={`h-4 w-4 rounded-sm ${ok ? "bg-emerald-500" : "bg-rose-500"}`} />
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Accepted" value={accepted} />
        <Stat label="Rejected (429)" value={log.length - accepted} tone={log.length - accepted ? "text-rose-600" : ""} />
      </div>
      <p className="mt-2 text-xs text-ink-500">
        Notice: bursts up to the capacity are allowed, but sustained traffic above the refill rate gets throttled.
      </p>
    </SimFrame>
  );
}
