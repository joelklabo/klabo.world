"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardLogsState } from "@/lib/dashboardLogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DashboardLogsPanelProps = {
  dashboardSlug: string;
  refreshIntervalSeconds?: number | null;
};

type SeverityFilter = "all" | "Information" | "Warning" | "Error" | "Critical";

const severityOptions: { label: string; value: SeverityFilter }[] = [
  { label: "All severities", value: "all" },
  { label: "Info", value: "Information" },
  { label: "Warnings", value: "Warning" },
  { label: "Errors", value: "Error" },
  { label: "Critical", value: "Critical" },
];

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}

function severityBadgeClass(severity?: string) {
  if (!severity) return "bg-muted text-muted-foreground";
  const normalized = severity.toLowerCase();
  if (normalized.includes("critical")) return "bg-destructive/15 text-destructive";
  if (normalized.includes("error")) return "bg-destructive/10 text-destructive";
  if (normalized.includes("warning")) return "bg-primary/15 text-primary";
  if (normalized.includes("information") || normalized.includes("info"))
    return "bg-chart-3/15 text-chart-3";
  return "bg-muted text-muted-foreground";
}

export function DashboardLogsPanel({
  dashboardSlug,
  refreshIntervalSeconds,
}: DashboardLogsPanelProps) {
  const [state, setState] = useState<DashboardLogsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const refreshIntervalMs = useMemo(() => {
    if (
      typeof refreshIntervalSeconds === "number" &&
      refreshIntervalSeconds > 0
    ) {
      return Math.max(refreshIntervalSeconds * 1000, 15_000);
    }
    return 30_000;
  }, [refreshIntervalSeconds]);

  const fetchLogs = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (severity !== "all") {
        params.set("severity", severity);
      }
      if (searchQuery.trim().length > 0) {
        params.set("search", searchQuery.trim());
      }
      const response = await fetch(
        `/admin/dashboards/${dashboardSlug}/logs?${params.toString()}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const snippet = (await response.text()).slice(0, 200);
        throw new Error(
          response.redirected
            ? "Authentication required to view logs."
            : `Unexpected response from logs endpoint: ${snippet || "non-JSON payload"}`,
        );
      }
      const json = (await response.json()) as DashboardLogsState;
      setState(json);
      if (json.status === "error") {
        setError(json.message);
      }
    } catch (error_) {
      if ((error_ as { name?: string }).name === "AbortError") {
        return;
      }
      setError(
        error_ instanceof Error
          ? error_.message
          : "Unknown error while fetching logs.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [dashboardSlug, searchQuery, severity]);

  useEffect(() => {
    fetchLogs();
    return () => abortControllerRef.current?.abort();
  }, [fetchLogs]);

  useEffect(() => {
    const handle = setInterval(fetchLogs, refreshIntervalMs);
    return () => clearInterval(handle);
  }, [fetchLogs, refreshIntervalMs]);

  useEffect(() => {
    const handle = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const statusDescription = useMemo(() => {
    if (!state) return "Loading logs...";
    if (state.status === "success") {
      return `Showing ${state.entries.length} entr${state.entries.length === 1 ? "y" : "ies"}`;
    }
    if (state.status === "empty") {
      return state.reason;
    }
    if (state.status === "error") {
      return state.message;
    }
    return state.reason;
  }, [state]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Filter logs"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="flex-1 rounded-full"
          aria-label="Filter logs"
        />
        <select
          value={severity}
          onChange={(event) =>
            setSeverity(event.target.value as SeverityFilter)
          }
          className="h-9 rounded-full border border-input bg-background px-4 py-2 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label="Filter by severity level"
        >
          {severityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button type="button" onClick={fetchLogs} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="text-xs text-muted-foreground" role="status" aria-live="polite">
        {isLoading ? "Refreshing…" : statusDescription}
        {state?.status === "success" && (
          <span className="ml-2">
            Last updated {new Date(state.refreshedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {state?.status === "success" ? (
        <ul className="space-y-3">
          {state.entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-border/60 bg-background/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                  <p className="mt-2 text-sm text-foreground">{entry.message}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${severityBadgeClass(entry.severity)}`}
                >
                  {entry.severity ?? "Unknown"}
                </span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="mr-4">
                  Operation:{" "}
                  <span className="font-semibold text-foreground">
                    {entry.operationName ?? "—"}
                  </span>
                </span>
                <span>
                  Category:{" "}
                  <span className="font-semibold text-foreground">
                    {entry.category ?? "—"}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            {state?.status === "empty" ? state.reason : "Logs unavailable."}
          </div>
        )
      )}
    </div>
  );
}
