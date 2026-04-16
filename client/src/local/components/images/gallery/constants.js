"use strict";
/**
 * Constants and configurations for the image gallery
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SORT_OPTIONS = exports.BATCH_OPERATIONS = exports.VIEW_MODES = void 0;
var lucide_react_1 = require("lucide-react");
exports.VIEW_MODES = {
    grid: {
        gridClass: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
        icon: lucide_react_1.Grid,
        label: "Grid",
    },
    list: {
        gridClass: "grid grid-cols-1 gap-2",
        icon: lucide_react_1.List,
        label: "List",
    },
    masonry: {
        gridClass: "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4",
        icon: lucide_react_1.Layers,
        label: "Masonry",
    },
};
exports.BATCH_OPERATIONS = [
    { op: "download", icon: lucide_react_1.Download, label: "Download", color: "blue" },
    { op: "share", icon: lucide_react_1.Share2, label: "Share", color: "green" },
    { op: "archive", icon: lucide_react_1.Archive, label: "Archive", color: "yellow" },
    { op: "delete", icon: lucide_react_1.Trash2, label: "Delete", color: "red" },
    { op: "move", icon: lucide_react_1.Move, label: "Move", color: "purple" },
    { op: "copy", icon: lucide_react_1.Copy, label: "Copy", color: "indigo" },
    { op: "tag", icon: lucide_react_1.Tag, label: "Tag", color: "pink" },
];
exports.SORT_OPTIONS = [
    { value: "name", label: "Name", icon: lucide_react_1.SortAsc },
    { value: "date", label: "Date", icon: lucide_react_1.Calendar },
    { value: "size", label: "Size", icon: lucide_react_1.FileImage },
    { value: "rating", label: "Rating", icon: lucide_react_1.Star },
    { value: "usage", label: "Usage", icon: lucide_react_1.Eye },
];
