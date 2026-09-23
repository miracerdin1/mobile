export const formatMetaDate = (iso?: string) => {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
};

/** "14 Eyl 2026" — day, short month and year, for places where the year matters. */
export const formatFullDate = (iso?: string) => {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
