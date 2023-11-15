import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

export const runtime = 'edge';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(req: Request) {
  const json = await req.json();

  const res = await openai.createCompletion(json);

  if (!res.ok) {
    return res;
  }

  const stream = OpenAIStream(res, {});

  return new StreamingTextResponse(stream);
}
