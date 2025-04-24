import { generateObjectAction } from '@/action/ai';
import { TListStringSchema } from '@/interfaces/ai';
import { queryOptions } from '@tanstack/react-query';

const suggestionsPayload = {
  system:
    'You are a helpful assistant. You have to suggest a list of queries as a suggestion to the user through which a mind-map can be crated.',
  prompt: 'Please provide me a total of 5 ideas to create a mind-map.',
  schema: 'list(string)' as const,
};

const prefetchSuggestions = async () => {
  try {
    const response =
      await generateObjectAction<TListStringSchema>(suggestionsPayload);
    return response;
  } catch (error) {
    console.error('Error prefetching suggestions:', error);
    return null;
  }
};

export const mindMapSuggestionsOptions = queryOptions({
  queryKey: ['get-mind-map-suggestions'],
  queryFn: async () => {
    return await prefetchSuggestions();
  },
});
