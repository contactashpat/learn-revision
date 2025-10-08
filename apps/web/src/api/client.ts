export interface GraphQLRequestOptions<TVariables> {
  query: string;
  variables?: TVariables;
}

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/graphql';

export async function graphqlRequest<TData, TVariables = Record<string, unknown>>({
  query,
  variables,
}: GraphQLRequestOptions<TVariables>): Promise<TData> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error('Network error while contacting learning service');
  }

  const body = (await response.json()) as { data?: TData; errors?: Array<{ message: string }> };

  if (body.errors && body.errors.length > 0) {
    throw new Error(body.errors.map((err) => err.message).join('\n'));
  }

  if (!body.data) {
    throw new Error('Malformed response from learning service');
  }

  return body.data;
}
