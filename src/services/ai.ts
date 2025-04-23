export async function getAiResponse<T, U = undefined>(params: U) {
  const baseUrl = process.env.BASE_URL || '';
  const res = await fetch(`${baseUrl}/api/ai/response`, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const response: Response & { data: T | null } = { ...res, data: null };
  try {
    response['data'] = await res.json();
  } catch (error) {
    console.log(`error->`, error);
  } finally {
    return response;
  }
}
