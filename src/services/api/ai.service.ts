import { openai } from '@ai-sdk/openai';
import { createAzure } from '@ai-sdk/azure';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex';

export const getModelProvider = (
  model: string,
  options?: {
    baseURL?: string;
    apiVersion?: string;
    reasoning?: 'medium' | 'low' | 'high';
    apiKey?: string;
    // Azure specific
    resourceName?: string;
    // Google vertex specific
    clientEmail?: string;
    privateKey?: string;
  },
) => {
  const {
    reasoning,
    apiKey,
    resourceName,
    baseURL,
    apiVersion,
    clientEmail,
    privateKey,
  } = options || {};

  if (model.startsWith('azure:') && (resourceName || baseURL)) {
    const azure = createAzure({
      apiKey,
      apiVersion,
      baseURL,
      resourceName,
    });

    return { model: azure(model.replace('azure:', '')) };
  } else if (model.startsWith('claude-') && apiKey) {
    const anthropic = createAnthropic({
      apiKey,
      baseURL,
    });

    return { model: anthropic(model) };
  } else if (model.startsWith('vertex:') && clientEmail && privateKey) {
    const vertex = createVertex({
      googleAuthOptions: {
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
      },
    });

    return {
      model: vertex(model.replace('vertex:', '')),
    };
  } else if (model.startsWith('gemini-') && apiKey) {
    const google = createGoogleGenerativeAI({
      baseURL,
      apiKey,
    });

    return {
      model: google(model),
    };
  } else if (model.startsWith('gpt-') && apiKey) {
    return {
      model: openai(model, { reasoningEffort: reasoning }),
      apiKey,
    };
  }

  throw new Error(
    `Model ${model} not supported. Please provide a valid model name.`,
  );
};
