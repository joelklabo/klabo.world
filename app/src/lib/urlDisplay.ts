export function getHostnameForDisplay(url?: string | null): string {
  if (!url) {
    return 'dashboard';
  }
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, '');
  }
}

