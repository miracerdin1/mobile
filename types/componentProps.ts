import type { ReactElement, ReactNode, Ref } from "react";
import type { StyleProp, TextStyle, View, ViewStyle } from "react-native";

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
  onOpenLibrary: () => void;
  /** Links per category (and "All"), shown next to each tab label. */
  counts?: Record<string, number>;
  /** The latest save: its category tab (and "All") hops once per nonce. */
  bump?: { category: string; nonce: number } | null;
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
  /** Set once the save succeeds: the card shows the saved link instead of the URL. */
  savedLink?: Link | null;
  /** The card's box, measured as the start of the fly-to-tab animation. */
  cardRef?: Ref<View>;
}

export interface LinkListProps {
  /** A link was opened from the list (records it for the forgotten wheel). */
  onOpened?: (link: Link) => void;
  header?: ReactElement | null;
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
