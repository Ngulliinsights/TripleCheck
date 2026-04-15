/**
 * Constants and configurations for the image gallery
 */

import {
  Grid as GridIcon,
  List,
  Layers,
  Download,
  Share2,
  Archive,
  Trash2,
  Move,
  Copy,
  Tag,
  SortAsc,
  Calendar,
  FileImage,
  Star,
  Eye,
} from "lucide-react";

export const VIEW_MODES = {
  grid: {
    gridClass: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
    icon: GridIcon,
    label: "Grid",
  },
  list: {
    gridClass: "grid grid-cols-1 gap-2",
    icon: List,
    label: "List",
  },
  masonry: {
    gridClass: "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4",
    icon: Layers,
    label: "Masonry",
  },
} as const;

export const BATCH_OPERATIONS = [
  { op: "download", icon: Download, label: "Download", color: "blue" },
  { op: "share", icon: Share2, label: "Share", color: "green" },
  { op: "archive", icon: Archive, label: "Archive", color: "yellow" },
  { op: "delete", icon: Trash2, label: "Delete", color: "red" },
  { op: "move", icon: Move, label: "Move", color: "purple" },
  { op: "copy", icon: Copy, label: "Copy", color: "indigo" },
  { op: "tag", icon: Tag, label: "Tag", color: "pink" },
] as const;

export const SORT_OPTIONS = [
  { value: "name", label: "Name", icon: SortAsc },
  { value: "date", label: "Date", icon: Calendar },
  { value: "size", label: "Size", icon: FileImage },
  { value: "rating", label: "Rating", icon: Star },
  { value: "usage", label: "Usage", icon: Eye },
] as const;
