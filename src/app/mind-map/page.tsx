import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { mindMapSuggestionsOptions } from '@/queries/mind-map';
import MindMapClientPage from './_components/mind-map-client';

export default async function MindMapPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(mindMapSuggestionsOptions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MindMapClientPage />
    </HydrationBoundary>
  );
}
