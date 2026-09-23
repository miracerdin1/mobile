import type { Link } from "../types";

/** A link counts as forgotten once it has sat unopened this long. */
export const FORGOTTEN_AFTER_DAYS = 30;
/** The wheel shows at most this many, oldest first. */
export const FORGOTTEN_MAX = 12;

const DAY_MS = 24 * 60 * 60 * 1000;

export const ownerIdOf = (link: Link) => (typeof link.owner === "string" ? link.owner : link.owner?._id);

export const daysSince = (iso: string | undefined, now: number) => {
  const time = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(time) ? 0 : Math.floor((now - time) / DAY_MS);
};

/**
 * The user's own links saved a month or more ago and never opened or
 * dismissed since. Broken links are left out: nothing to rediscover there.
 */
export function selectForgotten(links: Link[], userId: string | undefined, now = Date.now()): Link[] {
  if (!userId) return [];
  return links
    .filter(
      (link) =>
        ownerIdOf(link) === userId &&
        !link.openedAt &&
        !link.dismissedAt &&
        !link.isBroken &&
        daysSince(link.createdAt, now) >= FORGOTTEN_AFTER_DAYS,
    )
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
    .slice(0, FORGOTTEN_MAX);
}
