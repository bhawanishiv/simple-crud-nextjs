const request = (
  url: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body: any = null,
  options: any = {}
) => {
  const { headers, ...rest } = options;
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'undefined' ? undefined : JSON.stringify(body),
    ...rest,
  });
};

const api = { request: request };

export default api;
