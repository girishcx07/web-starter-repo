export class CallerError extends Error {
  readonly status: number;
  readonly response: Response;

  constructor(message: string, response: Response) {
    super(message);
    this.name = "CallerError";
    this.response = response;
    this.status = response.status;
  }
}

export interface CallerContext {
  url: string;
  init: RequestInit;
}

export type CallerMiddleware = (
  ctx: CallerContext,
  next: () => Promise<Response>,
) => Promise<Response>;

export interface CallerOptions {
  baseUrl?: string;
  defaultHeaders?: HeadersInit;
  credentials?: RequestCredentials;
  fetch?: typeof fetch;
  /** Retries on network failure or 5xx (not 4xx). Default 0. */
  retries?: number;
  retryDelayMs?: number;
}

function joinUrl(base: string, path: string) {
  if (!path.startsWith("/")) return `${base.replace(/\/$/, "")}/${path}`;
  return `${base.replace(/\/$/, "")}${path}`;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function compose(
  middlewares: CallerMiddleware[],
  terminal: (ctx: CallerContext) => Promise<Response>,
): (ctx: CallerContext) => Promise<Response> {
  return (ctx) => {
    let index = 0;
    const dispatch = (i: number): Promise<Response> => {
      if (i >= middlewares.length) {
        return terminal(ctx);
      }
      return middlewares[i]!(ctx, () => dispatch(i + 1));
    };
    return dispatch(0);
  };
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  headers?: HeadersInit;
  /** JSON body (sets Content-Type unless overridden). */
  json?: unknown;
  /** Raw body (FormData, Blob, string, etc.). */
  body?: BodyInit | null;
  /** When true, returns the raw `Response` (streaming, non-JSON). */
  raw?: boolean;
}

export interface Caller {
  use(mw: CallerMiddleware): Caller;
  request(path: string, init?: RequestOptions): Promise<Response>;
  get<T = any>(path: string, init?: RequestOptions): Promise<T>;
  post<T = any>(path: string, init?: RequestOptions): Promise<T>;
  put<T = any>(path: string, init?: RequestOptions): Promise<T>;
  patch<T = any>(path: string, init?: RequestOptions): Promise<T>;
  delete<T = any>(path: string, init?: RequestOptions): Promise<T>;
}

export function createCaller(options: CallerOptions = {}): Caller {
  const fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  const baseUrl = options.baseUrl ?? "";
  const credentials = options.credentials ?? "include";
  const retries = options.retries ?? 0;
  const retryDelayMs = options.retryDelayMs ?? 250;
  const middlewares: CallerMiddleware[] = [];

  const terminal = async (ctx: CallerContext) => {
    let attempt = 0;
    for (;;) {
      try {
        const res = await fetchFn(ctx.url, {
          ...ctx.init,
          credentials: ctx.init.credentials ?? credentials,
        });
        if (res.status >= 500 && attempt < retries) {
          attempt++;
          await sleep(retryDelayMs * attempt);
          continue;
        }
        return res;
      } catch (e) {
        if (attempt < retries) {
          attempt++;
          await sleep(retryDelayMs * attempt);
          continue;
        }
        throw e;
      }
    }
  };

  const run = (ctx: CallerContext) => compose(middlewares, terminal)(ctx);

  const buildInit = (
    method: string,
    init?: RequestOptions,
  ): RequestInit => {
    const headers = new Headers(options.defaultHeaders);
    if (init?.headers) {
      new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    }
    let body: BodyInit | null | undefined = init?.body;
    if (init?.json !== undefined) {
      body = JSON.stringify(init.json);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
    const { json: _j, raw: _r, ...rest } = init ?? {};
    return {
      ...rest,
      method,
      headers,
      body: body ?? rest.body,
    };
  };

  async function requestUnwrapped<T>(path: string, init?: RequestOptions): Promise<T> {
    const res = await api.request(path, init);
    if (!res.ok) {
      throw new CallerError(`HTTP ${res.status} for ${path}`, res);
    }
    if (init?.raw) {
      return res as unknown as T;
    }
    if (res.status === 204) {
      return undefined as T;
    }
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  }

  const api: Caller = {
    use(mw) {
      middlewares.push(mw);
      return api;
    },

    async request(path, init) {
      const url = joinUrl(baseUrl, path);
      const ctx: CallerContext = { url, init: buildInit(init?.method ?? "GET", init) };
      return run(ctx);
    },

    get<T>(path: string, init?: RequestOptions) {
      return requestUnwrapped<T>(path, { ...init, method: "GET" });
    },

    post<T>(path: string, init?: RequestOptions) {
      return requestUnwrapped<T>(path, { ...init, method: "POST" });
    },

    put<T>(path: string, init?: RequestOptions) {
      return requestUnwrapped<T>(path, { ...init, method: "PUT" });
    },

    patch<T>(path: string, init?: RequestOptions) {
      return requestUnwrapped<T>(path, { ...init, method: "PATCH" });
    },

    delete<T>(path: string, init?: RequestOptions) {
      return requestUnwrapped<T>(path, { ...init, method: "DELETE" });
    },
  };

  return api;
}
