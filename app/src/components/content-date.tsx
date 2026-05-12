import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { formatDisplayDate, getDateTimeAttr, type DateInput } from '@/lib/dateDisplay';

type ContentDateProps = Omit<ComponentPropsWithoutRef<'time'>, 'dateTime' | 'children'> & {
  value: DateInput;
  fallback?: DateInput;
  options?: Intl.DateTimeFormatOptions;
  children?: ReactNode;
};

export function ContentDate({
  value,
  fallback = null,
  options,
  children,
  ...props
}: ContentDateProps) {
  return (
    <time dateTime={getDateTimeAttr(value, fallback)} {...props}>
      {children ?? formatDisplayDate(value, fallback, options)}
    </time>
  );
}
