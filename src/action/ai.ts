'use server';

import { generateText, streamText, streamObject, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai'; // Ensure OPENAI_API_KEY environment variable is set
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
    if (
      await checkRateLimits({
        feature: `generateObject:${payload.schema}`,
        maxRequests: payload.schema === 'list(string)' ? 10 : undefined,
      })
    ) {
      throw new Error('Rate limit exceeded');
    }
    const { schema, ...restBody } =
      await aiRequestWithSchemaSchema.parseAsync(payload); // Validate request body

    if (!(schema in schemas)) {
      throw new Error(`Invalid schema key: ${schema}`);
    }

    const schemaObj = schemas[schema as keyof typeof schemas];

    const result = await generateObject<T>({
      ...restBody,
      model: openai(process.env.OPENAI_MODEL || ''),
      schema: schemaObj as ZodType,
    });

    return result.object as T;
  } catch (error) {
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
