import type { Link } from "../types";
import { daysSince, ownerIdOf, selectForgotten } from "./forgotten";

/**
 * Numbers for the weekly recap, from the links already on the device. "This
 * week" is the last seven days ending today, so the recap reads the same
 * whichever day it is opened.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const WEEKDAYS_LONG = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export interface RecapDay {
  label: string;
  longLabel: string;
  count: number;
}

export interface WeeklyRecap {
  /** First and last day of the window, for the page eyebrow. */
  from: Date;
  to: Date;
  total: number;
  /** Seven days, oldest first, ending today. */
  days: RecapDay[];
  busiestDay: RecapDay | null;
  topSite: { name: string; count: number; links: Link[] } | null;
  /** Category → count, largest first. */
  categories: Array<{ category: string; count: number }>;
  /** The largest category last week, when it differs from this week's. */
  previousTopCategory: string | null;
  oldestForgotten: Link | null;
}

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const startOfDay = (time: number) => {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const countBy = <T,>(items: T[], key: (item: T) => string) => {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

export function buildWeeklyRecap(links: Link[], userId: string | undefined, now = Date.now()): WeeklyRecap {
  const today = startOfDay(now);
  const windowStart = today - 6 * DAY_MS;
  const mine = links.filter((link) => ownerIdOf(link) === userId);
  const timeOf = (link: Link) => (link.createdAt ? new Date(link.createdAt).getTime() : NaN);

  const thisWeek = mine.filter((link) => timeOf(link) >= windowStart);
  const lastWeek = mine.filter((link) => timeOf(link) >= windowStart - 7 * DAY_MS && timeOf(link) < windowStart);

  const days: RecapDay[] = Array.from({ length: 7 }, (_, i) => {
    const start = windowStart + i * DAY_MS;
    const weekday = new Date(start).getDay();
    return {
      label: WEEKDAYS[weekday],
      longLabel: WEEKDAYS_LONG[weekday],
      count: thisWeek.filter((link) => timeOf(link) >= start && timeOf(link) < start + DAY_MS).length,
    };
  });
  const busiest = days.reduce<RecapDay | null>((best, day) => (day.count > (best?.count ?? 0) ? day : best), null);

  const sites = countBy(thisWeek, (link) => link.siteName?.trim() || hostname(link.url));
  const [siteName, siteCount] = sites[0] ?? [];
  const topSite =
    siteName && siteCount && siteCount > 1
      ? { name: siteName, count: siteCount, links: thisWeek.filter((l) => (l.siteName?.trim() || hostname(l.url)) === siteName) }
      : null;

  const categories = countBy(thisWeek, (link) => link.category || "Other").map(([category, count]) => ({ category, count }));
  const previousTop = countBy(lastWeek, (link) => link.category || "Other")[0]?.[0] ?? null;

  return {
    from: new Date(windowStart),
    to: new Date(today),
    total: thisWeek.length,
    days,
    busiestDay: busiest,
    topSite,
    categories,
    previousTopCategory: previousTop && previousTop !== categories[0]?.category ? previousTop : null,
    oldestForgotten: selectForgotten(links, userId, now)[0] ?? null,
  };
}

export { daysSince };
