import { generateText, streamText, streamObject, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai'; // Ensure OPENAI_API_KEY environment variable is set
import schemas from '@/lib/schema';
import { aiRequestSchema } from '@/interfaces/ai';
import { ZodType } from 'zod';
export const runtime = 'edge';

// Define Zod schema for body validation

export async function POST(req: Request) {
  let body;
  try {
    const json = await req.json();
    body = aiRequestSchema.parse(json); // Validate request body
  } catch (error) {
    console.log(`error->`, error);
    return new Response('Invalid request body', { status: 400 });
  }

  try {
    const { stream, schema, ...restBody } = body;

    if (stream) {
      if (schema) {
        const result = streamObject({
          ...restBody,
          model: openai(process.env.OPENAI_MODEL || '', {
            structuredOutputs: true,
          }),
          schema:
            (schemas[schema as keyof typeof schemas] as ZodType<any>) ?? null,
        });

        return result.toTextStreamResponse();
      }

      const result = streamText({
        ...restBody,
        model: openai(process.env.OPENAI_MODEL || ''),
      });

      return result.toDataStreamResponse();
    }

    if (schema) {
      const result = await generateObject({
        ...restBody,
        model: openai(process.env.OPENAI_MODEL || ''),
        schema: schemas[schema as keyof typeof schemas] ?? null,
      });
      return result.toJsonResponse();
    }

    const {
      finishReason,
      text,
      usage,
      response: { body: _body, headers, ...restResponse },
    } = await generateText({
      ...restBody,
      model: openai(process.env.OPENAI_MODEL || ''),
    });

    return new Response(
      JSON.stringify({ finishReason, text, usage, response: restResponse }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('An error occurred:', error);
    return new Response(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    );
  }
}
