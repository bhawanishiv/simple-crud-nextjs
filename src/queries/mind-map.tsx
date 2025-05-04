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
    // console.error('Error prefetching suggestions:', error);
    return null;
  }
};

export const mindMapSuggestionsOptions = queryOptions({
  queryKey: ['get-mind-map-suggestions'],
  queryFn: async () => {
    const suggestions = await prefetchSuggestions();

    if (suggestions) {
      return suggestions;
    }
    return {
      list: [
        {
          text: 'Organizational Structure: Outline the hierarchy and relationships within an organization.',
        },
        {
          text: 'Project Planning: Break down tasks, timelines, and resources for a project.',
        },
        {
          text: 'Educational Curriculum: Map out subjects, topics, and learning objectives for a course.',
        },
        {
          text: 'Website Sitemap: Visualize the structure and navigation paths of a website.',
        },
        {
          text: 'Family Tree: Depict familial relationships and lineage in a structured format.',
        },
        {
          text: 'Business Strategy: Develop a roadmap for achieving business goals and objectives.',
        },
        {
          text: 'Event Planning: Organize activities, schedules, and logistics for an event.',
        },
        {
          text: 'Research Topics: Brainstorm and categorize ideas for academic or professional research.',
        },
        {
          text: 'Product Development: Plan features, milestones, and workflows for a product lifecycle.',
        },
        {
          text: 'Personal Goals: Create a visual representation of short-term and long-term goals.',
        },
      ],
    };
  },
});
