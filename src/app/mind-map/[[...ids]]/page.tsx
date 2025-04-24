import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { mindMapSuggestionsOptions } from '@/queries/mind-map';
import MindMapClientPage from './_components/mind-map-client';

export const dynamicParams = true;
// or false, to 404 on unknown paths
export const revalidate = 60;

export default async function MindMapPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(mindMapSuggestionsOptions);

  // Disable static generation by using dynamic rendering

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MindMapClientPage />
    </HydrationBoundary>
  );
}
