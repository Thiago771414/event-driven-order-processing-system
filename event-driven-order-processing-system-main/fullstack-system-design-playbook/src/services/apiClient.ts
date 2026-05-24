import {
  API_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  HTTP_HEADERS,
  JSON_CONTENT_TYPE,
} from '../utils/constants';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RetryPolicy {
  attempts: number;
  delayMs: number;
  retryOnStatuses: number[];
  retryOnMethods: HttpMethod[];
}

export interface ApiRequestContext {
  authToken?: string;
  correlationId?: string;
  idempotencyKey?: string;
  traceParent?: string;
}

export interface ApiRequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  context?: ApiRequestContext;
  timeoutMs?: number;
  retry?: Partial<RetryPolicy>;
}

export interface NormalizedApiRequest {
  url: string;
  init: RequestInit;
}

export type RequestInterceptor = (
  request: NormalizedApiRequest,
) => NormalizedApiRequest | Promise<NormalizedApiRequest>;

export type ResponseInterceptor = (
  response: Response,
) => Response | Promise<Response>;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: unknown,
    readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'ApiTimeoutError';
  }
}

const requestInterceptors = new Set<RequestInterceptor>();
const responseInterceptors = new Set<ResponseInterceptor>();

const defaultRetryPolicy: RetryPolicy = {
  attempts: 1,
  delayMs: 300,
  retryOnStatuses: [408, 429, 500, 502, 503, 504],
  retryOnMethods: ['GET'],
};

export function addRequestInterceptor(interceptor: RequestInterceptor) {
  requestInterceptors.add(interceptor);
  return () => requestInterceptors.delete(interceptor);
}

export function addResponseInterceptor(interceptor: ResponseInterceptor) {
  responseInterceptors.add(interceptor);
  return () => responseInterceptors.delete(interceptor);
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const method = options.method ?? 'GET';
  const retryPolicy = buildRetryPolicy(method, options.retry);
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryPolicy.attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const request = await applyRequestInterceptors(
        buildRequest(path, options, method, controller.signal),
      );

      // fetch is centralized here so components, hooks and stores depend on a
      // stable API boundary instead of transport details.
      const response = await fetch(request.url, request.init);
      const interceptedResponse = await applyResponseInterceptors(response);

      if (shouldRetry(interceptedResponse, method, retryPolicy, attempt)) {
        await delay(retryPolicy.delayMs * (attempt + 1));
        continue;
      }

      if (!interceptedResponse.ok) {
        throw await buildApiError(interceptedResponse);
      }

      return parseResponse<TResponse>(interceptedResponse);
    } catch (error) {
      lastError = error;

      if (isAbortError(error)) {
        throw new ApiTimeoutError(timeoutMs);
      }

      if (attempt >= retryPolicy.attempts) {
        throw error;
      }

      await delay(retryPolicy.delayMs * (attempt + 1));
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

function buildRequest<TBody>(
  path: string,
  options: ApiRequestOptions<TBody>,
  method: HttpMethod,
  signal: AbortSignal,
): NormalizedApiRequest {
  const headers = new Headers(options.headers);
  const context = options.context;

  if (!headers.has(HTTP_HEADERS.contentType) && options.body !== undefined) {
    headers.set(HTTP_HEADERS.contentType, JSON_CONTENT_TYPE);
  }

  if (context?.authToken) {
    headers.set(HTTP_HEADERS.authorization, `Bearer ${context.authToken}`);
  }

  headers.set(
    HTTP_HEADERS.correlationId,
    context?.correlationId ?? createClientId(),
  );
  headers.set(HTTP_HEADERS.requestId, createClientId());

  if (context?.idempotencyKey) {
    headers.set(HTTP_HEADERS.idempotencyKey, context.idempotencyKey);
  }

  if (context?.traceParent) {
    headers.set(HTTP_HEADERS.traceParent, context.traceParent);
  }

  return {
    url: `${API_BASE_URL}${path}`,
    init: {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal,
    },
  };
}

async function applyRequestInterceptors(
  request: NormalizedApiRequest,
): Promise<NormalizedApiRequest> {
  let nextRequest = request;

  for (const interceptor of requestInterceptors) {
    nextRequest = await interceptor(nextRequest);
  }

  return nextRequest;
}

async function applyResponseInterceptors(response: Response): Promise<Response> {
  let nextResponse = response;

  for (const interceptor of responseInterceptors) {
    nextResponse = await interceptor(nextResponse);
  }

  return nextResponse;
}

function buildRetryPolicy(
  method: HttpMethod,
  retry?: Partial<RetryPolicy>,
): RetryPolicy {
  const merged = { ...defaultRetryPolicy, ...retry };

  return {
    ...merged,
    attempts: merged.retryOnMethods.includes(method) ? merged.attempts : 0,
  };
}

function shouldRetry(
  response: Response,
  method: HttpMethod,
  retryPolicy: RetryPolicy,
  attempt: number,
) {
  return (
    attempt < retryPolicy.attempts &&
    retryPolicy.retryOnMethods.includes(method) &&
    retryPolicy.retryOnStatuses.includes(response.status)
  );
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as TResponse) : (undefined as TResponse);
}

async function buildApiError(response: Response): Promise<ApiError> {
  const text = await response.text();
  const details = parseOptionalJson(text);
  const correlationId = response.headers.get(HTTP_HEADERS.correlationId) ?? undefined;

  return new ApiError(
    `API request failed with status ${response.status}`,
    response.status,
    details,
    correlationId,
  );
}

function parseOptionalJson(text: string) {
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function createClientId() {
  if ('crypto' in globalThis && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}
