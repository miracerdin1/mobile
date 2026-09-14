import type { Link } from "../types";
import type { FilterLinks } from "../types/linkFilters";

const normalizeSearchText = (value?: string) =>
  (value ?? "").trim().toLocaleLowerCase("tr-TR");

export const filterLinks: FilterLinks = (
  links,
  { searchQuery, selectedCategory, selectedFolderId },
) => {
  const query = normalizeSearchText(searchQuery);

  return links.filter((link: Link) => {
    if (selectedCategory !== "All" && link.category !== selectedCategory)
      return false;

    if (selectedFolderId !== null && link.folderId !== selectedFolderId)
      return false;

    if (!query) return true;

    return [
      link.title,
      link.url,
      link.description,
      link.siteName,
      link.category,
    ].some((value) => normalizeSearchText(value).includes(query));
  });
};
