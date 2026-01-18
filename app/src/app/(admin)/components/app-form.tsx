'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ImageUploadField } from './image-upload-field';
import { ImageListUploadField } from './image-list-upload-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type AppInput } from '@/lib/appPersistence';
import { type ActionState } from '../admin/apps/[slug]/actions';

type AppFormProps = {
  upsertAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction?: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initialData?: Partial<AppInput> & { slug?: string };
  mode: 'create' | 'edit';
};

type SubmitButtonProps = {
  label: string;
  testId?: string;
};

function SubmitButton({ label, testId }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} data-testid={testId}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

function DeleteButton({ action }: { action: (payload: FormData) => void }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      formAction={action}
      variant="destructive-outline"
      size="lg"
      disabled={pending}
      data-testid="apps-edit-delete"
    >
      {pending ? 'Deleting...' : 'Delete app'}
    </Button>
  );
}

export function AppForm({ upsertAction, deleteAction, initialData, mode }: AppFormProps) {
  const [state, formAction] = useActionState(upsertAction, { message: '', success: false });
  // We need a separate state for delete if we want to track its error independently,
  // but typically delete redirects or shows a global error.
  // For simplicity, we can share the state or just let the action redirect.
  // However, useActionState returns a wrapped action.
  // If we want to use deleteAction with useActionState, we need another hook call.
  const [deleteState, deleteFormAction] = useActionState(deleteAction || (async () => ({ message: '', success: false })), { message: '', success: false });
  const testIdPrefix = mode === 'edit' ? 'apps-edit' : 'apps-new';

  return (
    <form action={formAction} className="space-y-6" data-testid="apps-edit-form">
      {state.message && !state.success && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}
      {deleteState.message && !deleteState.success && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {deleteState.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (optional)</Label>
        <Input
          id="slug"
          name="slug"
          type="text"
          defaultValue={initialData?.slug}
          placeholder="my-app"
          data-testid={`${testIdPrefix}-slug`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={initialData?.name}
          required
          data-testid={`${testIdPrefix}-name`}
        />
        {state.errors?.name && <p className="text-xs text-destructive">{state.errors.name.join(', ')}</p>}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
          name="version"
          type="text"
          defaultValue={initialData?.version}
          required
          data-testid={`${testIdPrefix}-version`}
        />
        {state.errors?.version && <p className="text-xs text-destructive">{state.errors.version.join(', ')}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="publishDate">Publish date</Label>
        <Input
          id="publishDate"
          name="publishDate"
          type="date"
          defaultValue={initialData?.publishDate?.slice(0, 10)}
          required
          data-testid={`${testIdPrefix}-publish-date`}
        />
        {state.errors?.publishDate && <p className="text-xs text-destructive">{state.errors.publishDate.join(', ')}</p>}
      </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullDescription">Description</Label>
        <Textarea
          id="fullDescription"
          name="fullDescription"
          rows={5}
          defaultValue={initialData?.fullDescription}
          required
          data-testid={`${testIdPrefix}-description`}
        />
        {state.errors?.fullDescription && <p className="text-xs text-destructive">{state.errors.fullDescription.join(', ')}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea
          id="features"
          name="features"
          rows={6}
          defaultValue={initialData?.features?.join('\n')}
          data-testid={`${testIdPrefix}-features`}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="appStoreURL">App Store URL</Label>
          <Input
            id="appStoreURL"
          name="appStoreURL"
          type="url"
          autoComplete="url"
          defaultValue={initialData?.appStoreURL ?? ''}
          data-testid={`${testIdPrefix}-appstore`}
        />
        {state.errors?.appStoreURL && <p className="text-xs text-destructive">{state.errors.appStoreURL.join(', ')}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="githubURL">GitHub URL</Label>
          <Input
            id="githubURL"
          name="githubURL"
          type="url"
          autoComplete="url"
          defaultValue={initialData?.githubURL ?? ''}
          data-testid={`${testIdPrefix}-github`}
        />
        {state.errors?.githubURL && <p className="text-xs text-destructive">{state.errors.githubURL.join(', ')}</p>}
      </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ImageUploadField
          name="icon"
          label="Icon path"
          defaultValue={initialData?.icon ?? ''}
          helperText="Ideal size 512x512. Upload new assets or reuse /app-icons."
          tone="purple"
          inputTestId={`${testIdPrefix}-icon`}
          uploadButtonTestId={`${testIdPrefix}-icon-upload`}
        />
        <ImageListUploadField
          name="screenshots"
          label="Screenshots (one per line)"
          defaultValue={initialData?.screenshots?.join('\n') ?? ''}
          helperText="Uploads append to the textarea automatically."
          tone="purple"
          textareaTestId={`${testIdPrefix}-screenshots`}
          uploadButtonTestId={`${testIdPrefix}-screenshot-upload`}
        />
      </div>
      <div className="flex justify-between gap-3">
        {mode === 'edit' && deleteAction && (
          <DeleteButton action={deleteFormAction} />
        )}
        <SubmitButton label="Save changes" testId={`${testIdPrefix}-submit`} />
      </div>
    </form>
  );
}
