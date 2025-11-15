import { type DashboardDoc } from 'contentlayer/generated';
import { TextareaHTMLAttributes } from 'react';

type DashboardFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  dashboard?: DashboardDoc;
  includeSlugField?: boolean;
};

const panelTypeOptions = [
  { value: 'chart', label: 'Chart' },
  { value: 'logs', label: 'Logs' },
  { value: 'embed', label: 'Embed (iframe)' },
  { value: 'link', label: 'External Link' },
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
        <TextArea id="summary" name="summary" rows={3} required defaultValue={dashboard?.summary ?? ''} />
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
        </div>
      </div>

      <div>
        <Label htmlFor="kqlQuery">KQL query (for App Insights)</Label>
        <TextArea id="kqlQuery" name="kqlQuery" rows={6} placeholder="requests | summarize ..." defaultValue={dashboard?.kqlQuery ?? ''} />
      </div>

      <div>
        <Label htmlFor="notes">Notes / runbook</Label>
        <TextArea id="notes" name="notes" rows={6} placeholder="Explain how to use this dashboard." defaultValue={dashboard?.body?.raw ?? ''} />
      </div>

      <div>
        <button type="submit" className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
