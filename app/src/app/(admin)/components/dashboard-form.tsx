import { type DashboardDoc } from 'contentlayer/generated';
import { TextareaHTMLAttributes } from 'react';
import { MarkdownField } from './markdown-field';
import { MarkdownUploadHelper } from './upload-helper';

type DashboardFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  dashboard?: DashboardDoc;
  includeSlugField?: boolean;
};

const panelTypeOptions = [
  { value: 'chart', label: 'Chart – render KQL as a line/area/bar chart' },
  { value: 'logs', label: 'Logs – live feed of warnings/errors (KQL)' },
  { value: 'embed', label: 'Embed – show an iframe (Grafana, Azure, etc.)' },
  { value: 'link', label: 'External Link – CTA button to another dashboard' },
];

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700">
      {children}
    </label>
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

export function DashboardForm({ action, submitLabel, dashboard, includeSlugField = false }: DashboardFormProps) {
  return (
    <form action={action} className="space-y-6">
      {includeSlugField && dashboard && <input type="hidden" name="slug" value={dashboard.slug} />}
      <div>
        <Label htmlFor="title">Title</Label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={dashboard?.title ?? ''}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <Label htmlFor="summary">Summary</Label>
        <TextArea id="summary" name="summary" rows={3} required defaultValue={dashboard?.summary ?? ''} placeholder="Explain what this panel tracks." />
        <p className="mt-1 text-xs text-gray-500">Shown in the dashboards table and metadata sidebar.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <Label htmlFor="panelType">Panel type</Label>
          <select
            id="panelType"
            name="panelType"
            required
            defaultValue={dashboard?.panelType ?? 'chart'}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {panelTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Charts/logs require a KQL query; embed panels expect an iframe URL; links show a CTA that opens in a new tab.
          </p>
        </div>
        <div>
          <Label htmlFor="chartType">Chart type (optional)</Label>
          <input
            type="text"
            id="chartType"
            name="chartType"
            placeholder="line, bar, area..."
            defaultValue={dashboard?.chartType ?? ''}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <Label htmlFor="refreshIntervalSeconds">Refresh interval (seconds)</Label>
          <input
            type="number"
            min={0}
            step={15}
            id="refreshIntervalSeconds"
            name="refreshIntervalSeconds"
            placeholder="300"
            defaultValue={dashboard?.refreshIntervalSeconds ?? ''}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <input
          type="text"
          id="tags"
          name="tags"
          placeholder="telemetry,errors"
          defaultValue={dashboard?.tags?.join(', ') ?? ''}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">Used for quick filtering. Example: telemetry,prod,errors.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="iframeUrl">Iframe URL (for embeds)</Label>
          <input
            type="url"
            id="iframeUrl"
            name="iframeUrl"
            placeholder="https://portal.azure.com/..."
            defaultValue={dashboard?.iframeUrl ?? ''}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">Provide secure https:// URLs only. Required when “Embed” panel type is selected.</p>
      </div>
      <div>
        <Label htmlFor="externalUrl">External link</Label>
        <input
          type="url"
            id="externalUrl"
            name="externalUrl"
            placeholder="https://appsmith.com/apps/..."
          defaultValue={dashboard?.externalUrl ?? ''}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">Used for “Link” panels to launch full dashboards in a new tab.</p>
      </div>
      </div>

      <div>
        <Label htmlFor="kqlQuery">KQL query (for App Insights)</Label>
        <TextArea
          id="kqlQuery"
          name="kqlQuery"
          rows={6}
          placeholder="requests | summarize ..."
          defaultValue={dashboard?.kqlQuery ?? ''}
        />
        <p className="mt-1 text-xs text-gray-500">Required for chart + log panels. We run this via Log Analytics with the configured workspace.</p>
      </div>

      <div className="space-y-4">
        <MarkdownField
          name="notes"
          label="Notes / runbook"
          defaultValue={dashboard?.body?.raw ?? ''}
          placeholder="Explain how to use this panel, escalation runbooks, and handy commands."
          helperText="Supports Markdown + GFM. Use the preview to render Leaf-friendly HTML."
          rows={14}
        />
        <MarkdownUploadHelper />
      </div>

      <div>
        <button type="submit" className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
