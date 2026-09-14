import type { Link } from "./index";

export interface LinkFilterOptions {
  searchQuery: string;
  selectedCategory: string;
  selectedFolderId: string | null;
}

export type FilterLinks = (
  links: Link[],
  options: LinkFilterOptions,
) => Link[];
