import type { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search posts and apps.',
};

export default function SearchPage() {
  return <SearchPageClient />;
}
