export class CallerError extends Error {
  readonly status: number;
  readonly response: Response;
  readonly data: unknown;

  constructor(message: string, response: Response, data?: unknown) {
    super(message);
    this.name = "CallerError";
    this.response = response;
    this.status = response.status;
    this.data = data;
  }
}

export class CallerNetworkError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "CallerNetworkError";
    this.cause = cause;
  }
}

export type CallerResult<T> =
  | { ok: true; data: T; response: Response }
  | { ok: false; error: CallerError | CallerNetworkError; response?: Response };

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
  authToken?: string | null | (() => string | null | Promise<string | null>);
  /** Retries on network failure or 5xx (not 4xx). Default 0. */
  retries?: number;
  retryDelayMs?: number;
}

function joinUrl(base: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!base) return path;
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
    const dispatch = (i: number): Promise<Response> => {
      const middleware = middlewares[i];
      if (!middleware) {
        return terminal(ctx);
      }
      return middleware(ctx, () => dispatch(i + 1));
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
  /**
   * Explicit response parser. Defaults to JSON when the response content-type
   * is JSON, otherwise text. Use "response" for streams/manual parsing.
   */
  responseType?:
    | "json"
    | "text"
    | "blob"
    | "arrayBuffer"
    | "formData"
    | "response"
    | "void";
  /** @deprecated Use responseType: "response". */
  raw?: boolean;
}

export interface Caller {
  use(mw: CallerMiddleware): Caller;
  request(path: string, init?: RequestOptions): Promise<Response>;
  result<T = unknown>(
    path: string,
    init?: RequestOptions,
  ): Promise<CallerResult<T>>;
  get<T = unknown>(path: string, init?: RequestOptions): Promise<T>;
  post<T = unknown>(path: string, init?: RequestOptions): Promise<T>;
  post<T = unknown>(
    path: string,
    body: unknown,
    init?: RequestOptions,
  ): Promise<T>;
  put<T = unknown>(path: string, init?: RequestOptions): Promise<T>;
  put<T = unknown>(
    path: string,
    body: unknown,
    init?: RequestOptions,
  ): Promise<T>;
  patch<T = unknown>(path: string, init?: RequestOptions): Promise<T>;
  patch<T = unknown>(
    path: string,
    body: unknown,
    init?: RequestOptions,
  ): Promise<T>;
  delete<T = unknown>(path: string, init?: RequestOptions): Promise<T>;
  safe: {
    get<T = unknown>(
      path: string,
      init?: RequestOptions,
    ): Promise<CallerResult<T>>;
    post<T = unknown>(
      path: string,
      init?: RequestOptions,
    ): Promise<CallerResult<T>>;
    post<T = unknown>(
      path: string,
      body: unknown,
      init?: RequestOptions,
    ): Promise<CallerResult<T>>;
    put<T = unknown>(
      path: string,
      init?: RequestOptions,
    ): Promise<CallerResult<T>>;
    put<T = unknown>(
      path: string,
      body: unknown,
      init?: RequestOptions,
    ): Promise<CallerResult<T>>;
    patch<T = unknown>(
      path: string,
      init?: RequestOptions,
    ): Promise<CallerResult<T>>;
    patch<T = unknown>(
      path: string,
      body: unknown,
      init?: RequestOptions,
    ): Promise<CallerResult<T>>;
    delete<T = unknown>(
      path: string,
      init?: RequestOptions,
    ): Promise<CallerResult<T>>;
  };
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

  async function resolveAuthToken() {
    const token = options.authToken;
    if (typeof token === "function") return token();
    return token ?? null;
  }

  const buildInit = async (
    method: string,
    init?: RequestOptions,
  ): Promise<RequestInit> => {
    const headers = new Headers(options.defaultHeaders);
    if (init?.headers) {
      new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    }
    const authToken = await resolveAuthToken();
    if (authToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
    let body: BodyInit | null | undefined = init?.body;
    if (init?.json !== undefined) {
      body = JSON.stringify(init.json);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
    const { json: _j, raw: _r, responseType: _rt, ...rest } = init ?? {};
    return {
      ...rest,
      method,
      headers,
      body: body ?? rest.body,
    };
  };

  async function parseResponse<T>(
    res: Response,
    init?: RequestOptions,
  ): Promise<T> {
    const responseType = init?.raw ? "response" : init?.responseType;
    if (responseType === "response") return res as unknown as T;
    if (responseType === "void" || res.status === 204 || res.status === 205) {
      return undefined as T;
    }
    if (responseType === "blob") return (await res.blob()) as T;
    if (responseType === "arrayBuffer") return (await res.arrayBuffer()) as T;
    if (responseType === "formData") return (await res.formData()) as T;
    if (responseType === "text") return (await res.text()) as T;
    if (responseType === "json") return (await res.json()) as T;

    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  }

  async function requestUnwrapped<T>(
    path: string,
    init?: RequestOptions,
  ): Promise<T> {
    const res = await api.request(path, init);
    if (!res.ok) {
      let data: unknown;
      try {
        data = await parseResponse<unknown>(res.clone(), init);
      } catch {
        data = undefined;
      }
      throw new CallerError(`HTTP ${res.status} for ${path}`, res, data);
    }
    return parseResponse<T>(res, init);
  }

  function isRequestOptions(value: unknown): value is RequestOptions {
    if (!value || typeof value !== "object") return false;
    const keys = new Set(Object.keys(value));
    return [
      "body",
      "json",
      "headers",
      "responseType",
      "raw",
      "credentials",
      "signal",
      "cache",
      "mode",
      "redirect",
      "referrer",
      "referrerPolicy",
      "integrity",
      "keepalive",
      "priority",
      "window",
    ].some((key) => keys.has(key));
  }

  function bodyInit(
    bodyOrInit?: unknown,
    init?: RequestOptions,
  ): RequestOptions | undefined {
    if (init) {
      return { ...init, json: init.json ?? bodyOrInit };
    }
    if (isRequestOptions(bodyOrInit)) return bodyOrInit;
    if (bodyOrInit === undefined) return undefined;
    return { json: bodyOrInit };
  }

  async function safe<T>(
    path: string,
    init?: RequestOptions,
  ): Promise<CallerResult<T>> {
    try {
      const response = await api.request(path, init);
      if (!response.ok) {
        let data: unknown;
        try {
          data = await parseResponse<unknown>(response.clone(), init);
        } catch {
          data = undefined;
        }
        return {
          ok: false,
          error: new CallerError(
            `HTTP ${response.status} for ${path}`,
            response,
            data,
          ),
          response,
        };
      }
      return {
        ok: true,
        data: await parseResponse<T>(response.clone(), init),
        response,
      };
    } catch (error) {
      return {
        ok: false,
        error: new CallerNetworkError(`Network error for ${path}`, error),
      };
    }
  }

  const api: Caller = {
    use(mw) {
      middlewares.push(mw);
      return api;
    },

    async request(path, init) {
      const url = joinUrl(baseUrl, path);
      const ctx: CallerContext = {
        url,
        init: await buildInit(init?.method ?? "GET", init),
      };
      return run(ctx);
    },

    result<T>(path: string, init?: RequestOptions) {
      return safe<T>(path, init);
    },

    get<T>(path: string, init?: RequestOptions) {
      return requestUnwrapped<T>(path, { ...init, method: "GET" });
    },

    post<T>(path: string, bodyOrInit?: unknown, init?: RequestOptions) {
      return requestUnwrapped<T>(path, {
        ...bodyInit(bodyOrInit, init),
        method: "POST",
      });
    },

    put<T>(path: string, bodyOrInit?: unknown, init?: RequestOptions) {
      return requestUnwrapped<T>(path, {
        ...bodyInit(bodyOrInit, init),
        method: "PUT",
      });
    },

    patch<T>(path: string, bodyOrInit?: unknown, init?: RequestOptions) {
      return requestUnwrapped<T>(path, {
        ...bodyInit(bodyOrInit, init),
        method: "PATCH",
      });
    },

    delete<T>(path: string, init?: RequestOptions) {
      return requestUnwrapped<T>(path, { ...init, method: "DELETE" });
    },

    safe: {
      get<T>(path: string, init?: RequestOptions) {
        return safe<T>(path, { ...init, method: "GET" });
      },
      post<T>(path: string, bodyOrInit?: unknown, init?: RequestOptions) {
        return safe<T>(path, { ...bodyInit(bodyOrInit, init), method: "POST" });
      },
      put<T>(path: string, bodyOrInit?: unknown, init?: RequestOptions) {
        return safe<T>(path, { ...bodyInit(bodyOrInit, init), method: "PUT" });
      },
      patch<T>(path: string, bodyOrInit?: unknown, init?: RequestOptions) {
        return safe<T>(path, {
          ...bodyInit(bodyOrInit, init),
          method: "PATCH",
        });
      },
      delete<T>(path: string, init?: RequestOptions) {
        return safe<T>(path, { ...init, method: "DELETE" });
      },
    },
  };

  return api;
}
