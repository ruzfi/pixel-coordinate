import type { ResponseFull, ResponseViewModeOptions } from "@caido/sdk-frontend";

import type { FrontendSDK } from "./types";
import PixelCoordinateView from "./views/PixelCoordinateView.vue";

/**
 * Best-effort detection of an image response by scanning the (ASCII-safe)
 * Content-Type header inside the raw response text.
 */
function isImageResponse(raw: string): boolean {
  if (!raw) return false;
  const boundary = raw.indexOf("\r\n\r\n");
  const header = boundary >= 0 ? raw.slice(0, boundary) : raw.slice(0, 512);
  return /^content-type\s*:\s*image\//im.test(header);
}

export const init = (sdk: FrontendSDK) => {
  const viewMode: ResponseViewModeOptions<any> = {
    label: "Pixel Coordinates",
    view: { component: PixelCoordinateView },
    when: (response: ResponseFull) => isImageResponse(response.raw),
  };

  // Register on every page that displays responses.
  sdk.httpHistory?.addResponseViewMode(viewMode);
  sdk.replay?.addResponseViewMode(viewMode);
  sdk.search?.addResponseViewMode(viewMode);
  sdk.sitemap?.addResponseViewMode(viewMode);
  sdk.automate?.addResponseViewMode(viewMode);
  sdk.intercept?.addResponseViewMode(viewMode);
  sdk.findings?.addResponseViewMode(viewMode);
};
