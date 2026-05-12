'use client';

import { useFormStatus } from 'react-dom';
import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type ActionState = {
  message?: string;
  success?: boolean;
};

export function FormErrorMessage({ state }: { state?: ActionState | null }) {
  if (!state?.message || state.success) {
    return null;
  }
  return (
    <div
      className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
      role="alert"
      aria-live="assertive"
    >
      {state.message}
    </div>
  );
}

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  children?: ReactNode;
} & Omit<React.ComponentPropsWithoutRef<typeof Button>, 'children'>;

export function SubmitButton({
  label,
  pendingLabel = 'Saving...',
  children,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" {...props} disabled={pending || props.disabled}>
      {children ?? (pending ? pendingLabel : label)}
    </Button>
  );
}

type DeleteButtonProps = {
  action: (payload: FormData) => void;
  label?: string;
  pendingLabel?: string;
} & Omit<React.ComponentPropsWithoutRef<typeof Button>, 'type' | 'children'>;

export function DeleteButton({
  action,
  label = 'Delete',
  pendingLabel = 'Deleting...',
  ...props
}: DeleteButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      formAction={action}
      variant="destructive-outline"
      disabled={pending}
      {...props}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
