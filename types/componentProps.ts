import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

import type { Folder, Link, Reminder, User } from "./index";
import type { ViewMode } from "./viewMode";

export interface HomeHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClipboardPress: () => void;
  totalCount: number;
  visibleCount: number;
  activeCollectionName?: string;
}

export interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onManageCategories: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
}

export interface FolderListProps {
  folders: Folder[];
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  onManageFolders: () => void;
  onCreateFolder: () => void;
  currentUser: User | null;
}

export interface FolderChipProps {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  compact?: boolean;
  accessibilityLabel?: string;
}

export interface LogoProps {
  size?: number;
}

export interface PrimaryButtonProps {
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  compact?: boolean;
}

export interface ClipboardPromptProps {
  visible: boolean;
  clipboardUrl: string | null;
  clipboardFolderId: string | null;
  setClipboardFolderId: (id: string | null) => void;
  folders: Folder[];
  savingClipboard: boolean;
  onSave: () => Promise<void>;
  onDismiss: () => Promise<void>;
}

export interface LinkListProps {
  loading: boolean;
  filteredLinks: Link[];
  folders: Folder[];
  refreshing: boolean;
  onRefresh: () => void;
  handleDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onRemind: (link: Link) => void;
  reminders: Reminder[];
  listStyle?: StyleProp<ViewStyle>;
  centerStyle?: StyleProp<ViewStyle>;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  viewMode?: ViewMode;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}
