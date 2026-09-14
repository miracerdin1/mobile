export const formatMetaDate = (iso?: string) => {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
};
