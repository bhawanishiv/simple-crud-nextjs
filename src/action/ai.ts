'use server';

import { generateText, streamText, streamObject, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  aiRequestSchema,
  aiRequestWithSchemaSchema,
  TAiRequest,
  TAiRequestWithSchema,
  schemas,
} from '@/interfaces/ai';
import { ZodType } from 'zod';
import { headers } from 'next/headers';
import { rateLimit } from './rate-limit';
import { getModelProvider } from '@/services/api/ai.service';

async function checkRateLimits(options?: {
  feature?: string;
  maxRequests?: number;
  windowSize?: number;
}) {
  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown';
  return rateLimit(ip, options);
}

export const streamObjectAction = async <T = ZodType>(payload: TAiRequest) => {
  try {
    if (await checkRateLimits()) {
      throw new Error('Rate limit exceeded');
    }

    const { schema, ...restBody } =
      await aiRequestWithSchemaSchema.parseAsync(payload); // Validate request body

    if (!(schema in schemas)) {
      throw new Error(`Invalid schema key: ${schema}`);
    }

    const schemaObj = schemas[schema as keyof typeof schemas];

    const result = streamObject<T>({
      ...restBody,
      model: openai(process.env.OPENAI_MODEL || '', {
        structuredOutputs: true,
      }),
      schema: schemaObj as ZodType,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return null;
  }
};

export const streamTextAction = async (payload: TAiRequest) => {
  try {
    if (await checkRateLimits()) {
      throw new Error('Rate limit exceeded');
    }
    const body = await aiRequestSchema.parseAsync(payload); // Validate request body
    const result = streamText({
      ...body,
      model: openai(process.env.OPENAI_MODEL || ''),
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return null;
  }
};

export const generateObjectAction = async <T = ZodType>(
  payload: TAiRequestWithSchema,
) => {
  try {
    const {
      schema,
      model,
      resourceName,
      baseURL,
      apiVersion,
      reasoning,
      clientEmail,
      privateKey,
      apiKey,
      ...restBody
    } = await aiRequestWithSchemaSchema.parseAsync(payload); // Validate request body

    if (
      !apiKey &&
      (await checkRateLimits({
        feature: `generateObject:${schema}`,
        maxRequests: schema === 'list(string)' ? 10 : undefined,
      }))
    ) {
      throw new Error('Rate limit exceeded');
    }

    const finalApiKey = apiKey || process.env.OPENAI_API_KEY || '';

    if (!(schema in schemas)) {
      throw new Error(`Invalid schema key: ${schema}`);
    }

    const schemaObj = schemas[schema as keyof typeof schemas];
    const _model =
      model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo-instruct';

    console.log(`finalApiKey->`, finalApiKey);
    const modelDetails = getModelProvider(_model, {
      apiKey: finalApiKey,
      reasoning,
      resourceName,
      baseURL,
      apiVersion,
      clientEmail,
      privateKey,
    });

    const result = await generateObject<T>({
      ...restBody,
      model: modelDetails.model,
      headers: {
        'Content-Type': 'application/json',
        ...(modelDetails.apiKey
          ? { Authorization: `Bearer ${modelDetails.apiKey}` }
          : {}),
      },
      schema: schemaObj as ZodType,
    });

    return result.object as T;
  } catch (error) {
    console.log(`error->`, error);
    console.error(error.stack);
    return null;
  }
};

export const generateTextAction = async (payload: TAiRequest) => {
  try {
    if (await checkRateLimits()) {
      throw new Error('Rate limit exceeded');
    }
    const body = await aiRequestSchema.parseAsync(payload); // Validate request body

    const {
      finishReason,
      text,
      usage,
      response: { body: _body, headers: _headers, ...restResponse },
    } = await generateText({
      ...body,
      model: openai(process.env.OPENAI_MODEL || ''),
    });
    return {
      finishReason,
      text,
      usage,
      response: {
        ...restResponse,
      },
    };
  } catch (error) {
    return null;
  }
};
