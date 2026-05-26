export interface User {
  id: string;
  _id?: string;
  username: string;
  email?: string;
  plan?: "free" | "pro";
  role?: "user" | "admin";
}

export interface Folder {
  _id: string;
  name: string;
  icon: string;
  color: string;
  isPublic: boolean;
  owner: User | { _id: string; username: string };
  collaborators?: User[];
  createdAt?: string;
}

export interface Link {
  _id: string;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  category?: string;
  folderId?: string | null;
  isPublic?: boolean;
  owner?: string;
  reminderScheduled?: boolean;
  createdAt?: string;
}

export interface Reminder {
  linkId: string;
  notificationId: string;
}

export interface BioSettings {
  profileName: string;
  profileBio: string;
  profileAvatarUrl: string;
  profileTheme: string;
}

// Component Props Interfaces
export interface AuthScreenProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export interface BioSettingsDialogProps {
  visible: boolean;
  onDismiss: () => void;
  profileName: string;
  setProfileName: (val: string) => void;
  profileBio: string;
  setProfileBio: (val: string) => void;
  profileAvatarUrl: string;
  setProfileAvatarUrl: (val: string) => void;
  profileTheme: string;
  setProfileTheme: (val: string) => void;
  savingProfile: boolean;
  onSave: () => Promise<void>;
  theme: any;
}

export interface AccountSettingsDialogProps {
  visible: boolean;
  onDismiss: () => void;
  currentUser: User | null;
  deletingAccount: boolean;
  onDeleteAccount: () => void;
  onManageSubscription?: () => void;
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
  theme: any;
}

export interface CollaborationDialogProps {
  visible: boolean;
  onDismiss: () => void;
  currentFolder: Folder | null;
  currentUser: User | null;
  inviteUsernameOrEmail: string;
  setInviteUsernameOrEmail: (val: string) => void;
  inviting: boolean;
  onAddCollaborator: () => Promise<void>;
  onRemoveCollaborator: (colUserId: string) => Promise<void>;
  onLeaveFolder: () => Promise<void>;
}

export interface FolderFormDialogProps {
  visible: boolean;
  onDismiss: () => void;
  editingFolder: Folder | null;
  folderName: string;
  setFolderName: (val: string) => void;
  folderColor: string;
  setFolderColor: (val: string) => void;
  folderIcon: string;
  setFolderIcon: (val: string) => void;
  folderIsPublic: boolean;
  setFolderIsPublic: (val: boolean) => void;
  onSave: () => Promise<void>;
}

export interface ReminderDialogProps {
  visible: boolean;
  onDismiss: () => void;
  selectedReminderLink: Link | null;
  customReminderDate: Date;
  setCustomReminderDate: (d: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (b: boolean) => void;
  showTimePicker: boolean;
  setShowTimePicker: (b: boolean) => void;
  webCustomDateTime: string;
  setWebCustomDateTime: (s: string) => void;
  reminders: Reminder[];
  smartRemindersEnabled: boolean;
  onScheduleReminder: (
    link: Link,
    type: "1hour" | "evening" | "tomorrow" | "nextweek" | "instant" | "custom",
    customDate?: Date,
  ) => Promise<void>;
  onCancelReminder: (linkId: string) => Promise<void>;
  onToggleSmartReminders: (val: boolean) => Promise<void>;
}

export interface LinkCardProps {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  category?: string;
  folderName?: string;
  folderColor?: string;
  folderIcon?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  onRemind?: () => void;
  hasReminder?: boolean;
}
