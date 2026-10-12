import { Buffer } from "buffer";
import type { DefineAPI, SDK } from "caido:plugin";

/**
 * Binary-safe image data for a given response.
 */
export type ImageData = {
  /** The response body (only the body, headers stripped) encoded as base64. */
  base64: string;
  /** The Content-Type header value, e.g. "image/png". */
  contentType: string;
};

/**
 * Find the byte offset just past the first `\r\n\r\n` (the header/body boundary).
 * Returns -1 when no boundary is found.
 */
function findBodyOffset(bytes: Uint8Array): number {
  for (let i = 0; i <= bytes.length - 4; i++) {
    if (
      bytes[i] === 0x0d &&
      bytes[i + 1] === 0x0a &&
      bytes[i + 2] === 0x0d &&
      bytes[i + 3] === 0x0a
    ) {
      return i + 4;
    }
  }
  return -1;
}

/**
 * Extract the Content-Type header value from raw header bytes.
 */
function parseContentType(headerBytes: Uint8Array): string {
  let header = "";
  for (let i = 0; i < headerBytes.length; i++) {
    header += String.fromCharCode(headerBytes[i]!);
  }
  const match = /^content-type\s*:\s*([^\r\n]+)/im.exec(header);
  return match?.[1]?.trim() ?? "";
}

/**
 * Fetch the raw body of an HTTP response by its response ID.
 *
 * The GraphQL `response(id)` query returns `raw` as a base64-encoded `Blob`.
 * We decode it, strip the headers, and return just the body as base64 so the
 * frontend can render it without any lossy string conversions.
 */
async function getImageData(
  sdk: SDK,
  responseId: string,
): Promise<ImageData | null> {
  try {
    const result = await sdk.graphql.execute<{
      response?: { raw: string } | null;
    }>(
      `query GetResponse($id: ID!) { response(id: $id) { raw } }`,
      { id: responseId },
    );

    const raw = result.data?.response?.raw;
    if (!raw) return null;

    const bytes = Buffer.from(raw, "base64");
    const bodyOffset = findBodyOffset(bytes);
    if (bodyOffset < 0) return null;

    const body = bytes.subarray(bodyOffset);
    const headerBytes = bytes.subarray(0, bodyOffset);
    const contentType = parseContentType(headerBytes);

    if (!contentType.toLowerCase().startsWith("image/")) {
      return null;
    }

    return {
      base64: Buffer.from(body).toString("base64"),
      contentType,
    };
  } catch (err) {
    sdk.console.error(
      `[pixel-coordinate] Failed to load image: ${String(err)}`,
    );
    return null;
  }
}

export type API = DefineAPI<{
  getImageData: typeof getImageData;
}>;

export function init(sdk: SDK<API>) {
  sdk.api.register("getImageData", getImageData);
}
