"use client";

import { useState } from "react";
import { SimFrame, Slider, Stat } from "./ui";

export function LlmCostCalculator() {
  const [requestsPerDay, setRequestsPerDay] = useState(50_000);
  const [systemTokens, setSystemTokens] = useState(1_500);
  const [contextTokens, setContextTokens] = useState(4_000);
  const [outputTokens, setOutputTokens] = useState(400);
  const [inPrice, setInPrice] = useState(3); // $ per 1M input tokens (enter your provider's price)
  const [outPrice, setOutPrice] = useState(15); // $ per 1M output tokens
  const [cacheHit, setCacheHit] = useState(0); // % of system prompt served from prompt cache
  const [cacheDiscount] = useState(90); // cached input typically billed at a large discount

  const cachedSystem = systemTokens * (cacheHit / 100);
  const effectiveInput = systemTokens - cachedSystem + cachedSystem * (1 - cacheDiscount / 100) + contextTokens;
  const perRequest = (effectiveInput * inPrice + outputTokens * outPrice) / 1e6;
  const perDay = perRequest * requestsPerDay;
  const perMonth = perDay * 30;
  const inputShare = (effectiveInput * inPrice) / (effectiveInput * inPrice + outputTokens * outPrice);

  return (
    <SimFrame title="LLM cost estimator" hint="Prices vary by model and change often. Plug in your provider's current per-million-token prices. The structure of the math is what matters.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Requests per day" value={requestsPerDay} min={1_000} max={1_000_000} step={1_000} onChange={setRequestsPerDay} />
        <Slider label="System prompt + instructions" value={systemTokens} min={100} max={10_000} step={100} unit=" tok" onChange={setSystemTokens} />
        <Slider label="Retrieved context / history" value={contextTokens} min={0} max={50_000} step={500} unit=" tok" onChange={setContextTokens} />
        <Slider label="Output length" value={outputTokens} min={50} max={4_000} step={50} unit=" tok" onChange={setOutputTokens} />
        <Slider label="Input price" value={inPrice} min={0.1} max={20} step={0.1} unit=" $/M tok" onChange={setInPrice} />
        <Slider label="Output price" value={outPrice} min={0.4} max={80} step={0.2} unit=" $/M tok" onChange={setOutPrice} />
        <Slider label="Prompt-cache hit rate on system prompt" value={cacheHit} min={0} max={100} step={5} unit="%" onChange={setCacheHit} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Cost per request" value={`$${perRequest.toFixed(4)}`} />
        <Stat label="Per day" value={`$${perDay.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <Stat label="Per month" value={`$${perMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone="text-violet-600" />
        <Stat label="Input share of cost" value={`${Math.round(inputShare * 100)}%`} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Try: cut retrieved context from 20k to 4k tokens, or raise the cache hit rate. Context size and caching usually move the bill more than the model choice.
      </p>
    </SimFrame>
  );
}
