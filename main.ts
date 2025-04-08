#!/usr/bin/env node
import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { logger } from "hono/logger";
import { proxy } from 'hono/proxy';


const app = new Hono()

app.use(cors())

app.use(logger())

app.use(async (c, next) => {
  await next()
  c.res.headers.set("X-Accel-Buffering", "no")
})

app.get("/", (c) => c.text("A proxy for AI!"))

const fetchWithTimeout = async (
  url: string,
  { timeout, ...options }: RequestInit & { timeout: number },
) => {
  const controller = new AbortController()

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    const res = await proxy(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return res
  } catch (error) {
    clearTimeout(timeoutId)
    if (controller.signal.aborted) {
      return new Response("Request timeout", {
        status: 504,
      })
    }

    throw error
  }
}

const proxies: { pathSegment: string; target: string; orHostname?: string }[] =
  [
    {
      pathSegment: "generativelanguage",
      orHostname: "gooai.chatkit.app",
      target: "https://generativelanguage.googleapis.com",
    },
    {
      pathSegment: "groq",
      target: "https://api.groq.com",
    },
    {
      pathSegment: "anthropic",
      target: "https://api.anthropic.com",
    },
    {
      pathSegment: "pplx",
      target: "https://api.perplexity.ai",
    },
    {
      pathSegment: "openai",
      target: "https://api.openai.com",
    },
    {
      pathSegment: "mistral",
      target: "https://api.mistral.ai",
    },
    {
      pathSegment: "openrouter/api",
      target: "https://openrouter.ai/api",
    },
    {
      pathSegment: "openrouter",
      target: "https://openrouter.ai/api",
    },
    {
      pathSegment: "xai",
      target: "https://api.x.ai",
    },
  ]

app.post(
  "/custom-model-proxy",
  zValidator(
    "query",
    z.object({
      url: z.string().url(),
    }),
  ),
  async (c) => {
    const { url } = c.req.valid("query")

    const res = await proxy(url, {
      method: c.req.method,
      body: c.req.raw.body,
      headers: c.req.raw.headers,
    })

    return new Response(res.body, {
      headers: res.headers,
      status: res.status,
    })
  },
)

app.use(async (c, next) => {
  console.log(`[Proxy Middleware] Received request: ${c.req.method} ${c.req.url}`);
  const url = new URL(c.req.url)
  console.log(`[Proxy Middleware] Parsed URL pathname: ${url.pathname}, hostname: ${url.hostname}`);

  const proxy = proxies.find(
    (p) =>
      url.pathname.startsWith(`/${p.pathSegment}/`) ||
      (p.orHostname && url.hostname === p.orHostname),
  )

  if (proxy) {
    console.log(`[Proxy Middleware] Found matching proxy config for pathSegment: ${proxy.pathSegment}`);
    const headers = new Headers(c.req.raw.headers)
    if (proxy.pathSegment === "anthropic") {
      headers.delete("origin")
    }
    // Log original host before deleting
    const originalHost = headers.get('host');
    headers.delete('content-length')
    headers.delete('host')

    const targetPath = url.pathname.replace(`/${proxy.pathSegment}/`, "/")
    const targetUrl = `${proxy.target}${targetPath}${url.search}`
    console.log(`[Proxy Middleware] Forwarding to target URL: ${targetUrl}`);
    console.log(`[Proxy Middleware] Original Host header: ${originalHost}`);
    // console.log('[Proxy Middleware] Forwarding headers (excluding sensitive):', /* Consider logging specific non-sensitive headers if needed */);

    try {
      const res = await fetchWithTimeout(
        targetUrl,
        {
          method: c.req.method,
          headers, // Forward modified headers
          body: c.req.raw.body,
          timeout: 60000,
        },
      )

      console.log(`[Proxy Middleware] Received response from target: Status ${res.status}`);
      // Clone headers to avoid issues if they are consumed
      const responseHeaders = new Headers(res.headers);

      return new Response(res.body, {
        headers: responseHeaders,
        status: res.status,
      })
    } catch (error) {
       console.error('[Proxy Middleware] Error during fetchWithTimeout:', error);
       return new Response("Proxy fetch error", { status: 502 }); // Bad Gateway
    }

  } else {
    console.log(`[Proxy Middleware] No matching proxy config found for pathname: ${url.pathname}`);
  }

  // Call next middleware only if no proxy was matched or if proxy logic intends to fall through (which it doesn't here, it returns)
  // Correction: Need to call next() if NO proxy is found
  if (!proxy) {
    await next();
  }
  // If proxy WAS found, the return statement above prevents next() from being called, which is correct.
})

export default app
# 结束
