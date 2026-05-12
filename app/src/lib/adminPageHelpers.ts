import { requireAdminSession } from '@/lib/adminSession';

export async function runAdminPage<T>(render: () => Promise<T>): Promise<T> {
  await requireAdminSession();
  return render();
}
