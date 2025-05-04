import { use } from 'react';
import AiCredentialsContext from '@/components/ai-credentials.context';

export const useAiCredentials = () => {
  const context = use(AiCredentialsContext);
  if (!context) {
    throw new Error(
      'useAiCredentials must be used within an AiCredentialsProvider',
    );
  }
  return context;
};
