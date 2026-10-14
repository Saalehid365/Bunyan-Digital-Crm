import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";

const STORE_NAME = "client-files";
// Gitignored scratch dir — never committed, never deployed.
const LOCAL_DIR = path.join(process.cwd(), ".local-blobs", STORE_NAME);

/**
 * Netlify Blobs only has automatic credentials inside Netlify's own Functions/Next
 * runtime (or under the `netlify dev` CLI wrapper) — this app's local dev workflow is
 * plain `next dev`, which has neither. Rather than require a Netlify auth token for
 * local development, this falls back to the local filesystem whenever that context is
 * absent, so uploads can be built and tested end-to-end without any credentials, and
 * automatically use real Netlify Blobs the moment this app actually runs on Netlify.
 */
function isNetlifyRuntime(): boolean {
  return process.env.NETLIFY === "true" || Boolean(process.env.SITE_ID);
}

function localPath(key: string): string {
  return path.join(LOCAL_DIR, encodeURIComponent(key));
}

export async function putBlob(key: string, data: Buffer): Promise<void> {
  if (isNetlifyRuntime()) {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    // @netlify/blobs wants a real ArrayBuffer, not Node's Buffer (a Uint8Array subclass).
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    await store.set(key, arrayBuffer);
    return;
  }
  const filePath = localPath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
}

export async function getBlob(key: string): Promise<Buffer | null> {
  if (isNetlifyRuntime()) {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    const data = await store.get(key, { type: "arrayBuffer" });
    return data ? Buffer.from(data) : null;
  }
  try {
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deleteBlob(key: string): Promise<void> {
  if (isNetlifyRuntime()) {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    await store.delete(key);
    return;
  }
  await unlink(localPath(key)).catch(() => {});
}
