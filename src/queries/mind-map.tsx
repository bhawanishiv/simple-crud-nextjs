import { TListStringSchema } from '@/lib/schema';
import { getAiResponse } from '@/services/ai';
import { queryOptions } from '@tanstack/react-query';

const suggestionsPayload = {
  system:
    'You are a helpful assistant. You have to suggest a list of queries as a suggestion to the user through which a mind-map can be crated.',
  prompt: 'Please provide me a total of 5 ideas to create a mind-map.',
  schema: 'list(string)',
};

const prefetchSuggestions = async () => {
  try {
    const response = await getAiResponse<TListStringSchema, TSuggestionQuery>(
      suggestionsPayload
    );
    return response.data;
  } catch (error) {
    console.error('Error prefetching suggestions:', error);
    return null;
  }
};

type TSuggestionQuery = {
  system: string;
  prompt: string;
  schema: string;
};

export const mindMapSuggestionsOptions = queryOptions({
  queryKey: ['get-mind-map-suggestions'],
  queryFn: async () => {
    return await prefetchSuggestions();
  },
});
