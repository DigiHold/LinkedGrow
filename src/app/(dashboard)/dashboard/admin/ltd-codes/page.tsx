"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, AlertCircle, Check } from "lucide-react";

type Stats = Record<string, Record<string, { unused: number; redeemed: number; revoked: number }>>;

export default function AdminLtdCodesPage() {
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  const [genSource, setGenSource] = useState<"dealify" | "dealmirror" | "dealfuel">("dealify");
  const [genCount, setGenCount] = useState("500");
  const [genBatch, setGenBatch] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [genError, setGenError] = useState("");

  const [revokeText, setRevokeText] = useState("");
  const [revokeBusy, setRevokeBusy] = useState(false);
  const [revokeError, setRevokeError] = useState("");
  const [revokeSummary, setRevokeSummary] = useState<{
    total: number;
    revoked: number;
    unused_blocked: number;
    already_revoked: number;
    not_found: number;
  } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ltd/stats");
      const data = await res.json();
      setStats(data.stats || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenError("");
    setGenBusy(true);
    try {
      const count = parseInt(genCount, 10);
      const res = await fetch("/api/admin/ltd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: genSource, count, batch: genBatch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "Failed to generate");
        return;
      }
      // Download CSV
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${genBatch}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setGenBatch("");
      await refresh();
    } catch {
      setGenError("Something went wrong");
    } finally {
      setGenBusy(false);
    }
  }

  async function handleRevoke(e: React.FormEvent) {
    e.preventDefault();
    setRevokeError("");
    setRevokeSummary(null);
    setRevokeBusy(true);
    try {
      const res = await fetch("/api/admin/ltd/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: revokeText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRevokeError(data.error || "Failed to revoke");
        return;
      }
      setRevokeSummary(data.summary);
      setRevokeText("");
      await refresh();
    } catch {
      setRevokeError("Something went wrong");
    } finally {
      setRevokeBusy(false);
    }
  }

  const sources: Array<"dealify" | "dealmirror" | "dealfuel"> = ["dealify", "dealmirror", "dealfuel"];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">LTD codes</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Generate codes to send to Dealify / DealMirror / DealFuel, and revoke codes on refund.
        </p>
      </div>

      {/* Stats */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Stats by batch</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {sources.map((src) => {
              const batches = stats[src] || {};
              const batchKeys = Object.keys(batches).sort();
              if (batchKeys.length === 0) {
                return (
                  <div key={src}>
                    <h3 className="font-semibold capitalize text-slate-900 dark:text-white mb-2">{src}</h3>
                    <p className="text-sm text-slate-500">No batches yet.</p>
                  </div>
                );
              }
              return (
                <div key={src}>
                  <h3 className="font-semibold capitalize text-slate-900 dark:text-white mb-3">{src}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th className="pb-2 pr-4">Batch</th>
                          <th className="pb-2 pr-4 text-right">Unused</th>
                          <th className="pb-2 pr-4 text-right">Redeemed</th>
                          <th className="pb-2 pr-4 text-right">Revoked</th>
                          <th className="pb-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchKeys.map((b) => {
                          const s = batches[b];
                          const total = s.unused + s.redeemed + s.revoked;
                          return (
                            <tr key={b} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                              <td className="py-2 pr-4 font-mono text-xs">{b}</td>
                              <td className="py-2 pr-4 text-right">{s.unused}</td>
                              <td className="py-2 pr-4 text-right text-emerald-600 dark:text-emerald-400">{s.redeemed}</td>
                              <td className="py-2 pr-4 text-right text-red-600 dark:text-red-400">{s.revoked}</td>
                              <td className="py-2 text-right font-semibold">{total}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Generate */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Generate a new batch</h2>
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label className="mb-2 block">Marketplace</Label>
            <Select value={genSource} onValueChange={(v) => setGenSource(v as "dealify" | "dealmirror" | "dealfuel")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dealify">Dealify</SelectItem>
                <SelectItem value="dealmirror">DealMirror</SelectItem>
                <SelectItem value="dealfuel">DealFuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Count</Label>
            <Input
              type="number"
              min={1}
              max={10000}
              value={genCount}
              onChange={(e) => setGenCount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="mb-2 block">Batch name</Label>
            <Input
              value={genBatch}
              onChange={(e) => setGenBatch(e.target.value.toLowerCase())}
              placeholder="dealify-2026-04"
              pattern="[a-z0-9-]+"
              maxLength={64}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={genBusy}
            className="h-10"
          >
            {genBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-2" />Generate + download</>}
          </Button>
        </form>
        {genError && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {genError}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3">
          CSV downloads to your browser. Codes are also persisted to the DB so users can redeem them.
        </p>
      </section>

      {/* Revoke */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Revoke refunded codes</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Paste the refund list Dealify or DealMirror sends you, one code per line. Users who redeemed these codes will be downgraded to Free.
        </p>
        <form onSubmit={handleRevoke} className="space-y-4">
          <textarea
            value={revokeText}
            onChange={(e) => setRevokeText(e.target.value)}
            rows={8}
            className="w-full font-mono text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="DLFY-XXXX-XXXX-XXXX&#10;DLFY-YYYY-YYYY-YYYY&#10;..."
            maxLength={200000}
            required
          />
          <Button
            type="submit"
            disabled={revokeBusy || revokeText.trim().length === 0}
            className="bg-red-600 hover:bg-red-700 text-white h-10"
          >
            {revokeBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke these codes"}
          </Button>
        </form>
        {revokeError && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {revokeError}
          </div>
        )}
        {revokeSummary && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Check className="w-4 h-4" /> Processed {revokeSummary.total} codes
            </div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{revokeSummary.revoked} redeemed -&gt; revoked (users downgraded)</li>
              <li>{revokeSummary.unused_blocked} unused -&gt; blacklisted</li>
              <li>{revokeSummary.already_revoked} already revoked</li>
              <li>{revokeSummary.not_found} not found</li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
