'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { MarkdownField } from './markdown-field';
import { MarkdownUploadHelper } from './upload-helper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { type Dashboard } from '@/lib/dashboards';
import { type ActionState } from '../admin/dashboards/actions';

type DashboardFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  dashboard?: Dashboard;
  includeSlugField?: boolean;
};

const panelTypeOptions = [
  { value: 'chart', label: 'Chart – render KQL as a line/area/bar chart' },
  { value: 'logs', label: 'Logs – live feed of warnings/errors (KQL)' },
  { value: 'embed', label: 'Embed – show an iframe (Grafana, Azure, etc.)' },
  { value: 'link', label: 'External Link – CTA button to another dashboard' },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} data-testid="dashboard-submit">
      {pending ? 'Saving...' : label}
    </Button>
  );
}

export function DashboardForm({ action, submitLabel, dashboard, includeSlugField = false }: DashboardFormProps) {
  const [state, formAction] = useActionState(action, { message: '', success: false });

  return (
    <form action={formAction} className="space-y-6">
      {state.message && !state.success && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}
      {includeSlugField && dashboard && <input type="hidden" name="slug" value={dashboard.slug} />}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={dashboard?.title ?? ''}
          data-testid="dashboard-title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          name="summary"
          rows={3}
          required
          defaultValue={dashboard?.summary ?? ''}
          placeholder="Explain what this panel tracks."
          data-testid="dashboard-summary-input"
        />
        <p className="text-xs text-muted-foreground">Shown in the dashboards table and metadata sidebar.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="panelType">Panel type</Label>
          <select
            id="panelType"
          name="panelType"
          required
          defaultValue={dashboard?.panelType ?? 'chart'}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="dashboard-panel-type"
        >
          {panelTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Charts/logs require a KQL query; embed panels expect an iframe URL; links show a CTA that opens in a new tab.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="chartType">Chart type (optional)</Label>
          <Input
            type="text"
          id="chartType"
          name="chartType"
          placeholder="line, bar, area..."
          defaultValue={dashboard?.chartType ?? ''}
          data-testid="dashboard-chart-type"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="refreshIntervalSeconds">Refresh interval (seconds)</Label>
          <Input
            type="number"
            min={0}
            step={15}
          id="refreshIntervalSeconds"
          name="refreshIntervalSeconds"
          placeholder="300"
          defaultValue={dashboard?.refreshIntervalSeconds ?? ''}
          data-testid="dashboard-refresh-interval"
        />
      </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          type="text"
          id="tags"
          name="tags"
          placeholder="telemetry,errors"
          defaultValue={dashboard?.tags?.join(', ') ?? ''}
          data-testid="dashboard-tags"
        />
        <p className="text-xs text-muted-foreground">Used for quick filtering. Example: telemetry,prod,errors.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="iframeUrl">Iframe URL (for embeds)</Label>
          <Input
            type="url"
            id="iframeUrl"
            name="iframeUrl"
            placeholder="https://portal.azure.com/..."
            defaultValue={dashboard?.iframeUrl ?? ''}
            data-testid="dashboard-iframe-url"
          />
          <p className="text-xs text-muted-foreground">
            Provide secure https:// URLs only. Required when “Embed” panel type is selected.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalUrl">External link</Label>
          <Input
            type="url"
            id="externalUrl"
            name="externalUrl"
            placeholder="https://appsmith.com/apps/..."
            defaultValue={dashboard?.externalUrl ?? ''}
            data-testid="dashboard-external-url"
          />
          <p className="text-xs text-muted-foreground">Used for “Link” panels to launch full dashboards in a new tab.</p>
        </div>
      </div>

      <div>
        <Label htmlFor="kqlQuery">KQL query (for App Insights)</Label>
        <Textarea
          id="kqlQuery"
          name="kqlQuery"
          rows={6}
          placeholder="requests | summarize ..."
          defaultValue={dashboard?.kqlQuery ?? ''}
          data-testid="dashboard-kql"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Required for chart + log panels. We run this via Log Analytics with the configured workspace.
        </p>
      </div>

      <div className="space-y-4">
        <MarkdownField
          name="notes"
          label="Notes / runbook"
          defaultValue={dashboard?.body?.raw ?? ''}
          placeholder="Explain how to use this panel, escalation runbooks, and handy commands."
          helperText="Supports Markdown + GFM. Use the preview to render Leaf-friendly HTML."
          rows={14}
          textareaTestId="dashboard-notes"
          previewButtonTestId="dashboard-notes-preview"
        />
        <MarkdownUploadHelper />
      </div>

      <div>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
