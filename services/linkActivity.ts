import Config from "../constants/Config";
import api from "./api";

export type LinkActivity = "opened" | "dismissed";

/**
 * Tells the server the owner opened or dismissed a link (feeds the
 * forgotten-links wheel). Fire-and-forget: a failure only means the link
 * may show up in the wheel again, so it is logged, never surfaced.
 */
export function recordLinkActivity(linkId: string, action: LinkActivity) {
  api.post(`${Config.API_URL}/api/links/${linkId}/activity`, { action }).catch((error) => {
    console.warn("Link activity not recorded:", error?.message ?? error);
  });
}
