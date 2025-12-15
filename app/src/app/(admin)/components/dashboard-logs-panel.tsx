"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardLogsState } from "@/lib/dashboardLogs";
import { Button } from "@/components/ui/button";

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
  if (!severity) return "bg-gray-100 text-gray-600";
  const normalized = severity.toLowerCase();
  if (normalized.includes("critical")) return "bg-red-600/10 text-red-700";
  if (normalized.includes("error")) return "bg-red-100 text-red-700";
  if (normalized.includes("warning")) return "bg-yellow-100 text-yellow-800";
  if (normalized.includes("information") || normalized.includes("info"))
    return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-600";
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
      return Math.max(refreshIntervalSeconds * 1000, 15000);
    }
    return 30000;
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
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") {
        return;
      }
      setError(
        err instanceof Error
          ? err.message
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
        <input
          type="search"
          placeholder="Filter logs"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={severity}
          onChange={(event) =>
            setSeverity(event.target.value as SeverityFilter)
          }
          className="rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {severityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          onClick={fetchLogs}
          variant="outline"
          size="sm"
          className="bg-transparent border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        >
          Refresh
        </Button>
      </div>

      <div className="text-xs text-gray-500">
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
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-gray-500">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                  <p className="mt-2 text-sm text-gray-900">{entry.message}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${severityBadgeClass(entry.severity)}`}
                >
                  {entry.severity ?? "Unknown"}
                </span>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <span className="mr-4">
                  Operation:{" "}
                  <span className="font-semibold text-gray-700">
                    {entry.operationName ?? "—"}
                  </span>
                </span>
                <span>
                  Category:{" "}
                  <span className="font-semibold text-gray-700">
                    {entry.category ?? "—"}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            {state?.status === "empty" ? state.reason : "Logs unavailable."}
          </div>
        )
      )}
    </div>
  );
}
