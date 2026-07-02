import { NextResponse } from "next/server";

export const runtime = "nodejs";

const HF_HOSTS = new Set(["huggingface.co", "hf.co", "cdn-lfs.huggingface.co"]);

function isAllowedHfUrl(url: URL): boolean {
  return HF_HOSTS.has(url.hostname);
}

/** Proxy Hugging Face model files so the browser can load them with a server token. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (!path?.length) {
    return NextResponse.json({ error: "Missing path." }, { status: 400 });
  }

  const target = new URL(`https://huggingface.co/${path.join("/")}`);
  if (!isAllowedHfUrl(target)) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  const token = process.env.HF_TOKEN ?? process.env.HF_ACCESS_TOKEN;
  const headers: HeadersInit = {
    "User-Agent": "CatDex/1.0 transformers-proxy",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { headers, cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed." }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Hugging Face returned ${upstream.status}.` },
      { status: upstream.status },
    );
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("Content-Type", contentType);
  responseHeaders.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
