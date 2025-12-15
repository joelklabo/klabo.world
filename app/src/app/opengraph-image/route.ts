import { GET as ogGet } from '../og.png/route';

export const runtime = 'nodejs';
export const revalidate = 86400;

export async function GET() {
  return ogGet();
}
