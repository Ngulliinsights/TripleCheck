/**
 * Batch Operations Toolbar Component
 * Provides bulk actions for selected images.
 *
 * Changes vs original:
 * - Dynamic Tailwind class strings like `hover:bg-${color}-50` are never
 *   included in the purge/JIT scan and produce no output. Replaced with a
 *   static lookup map of pre-declared class strings.
 * - `handleOperation` wrapper was a no-op passthrough — removed, call prop directly.
 */

import React, { memo } from "react";
import { X } from "lucide-react";
import { BATCH_OPERATIONS } from "./constants";

interface BatchOperationsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchOperation: (operation: string) => void;
  userRole: string;
}

/** Pre-declared Tailwind classes so the JIT/purge scanner picks them up. */
const OPERATION_COLOR_CLASSES: Record<string, string> = {
  blue:   "hover:bg-blue-50   text-blue-600",
  green:  "hover:bg-green-50  text-green-600",
  yellow: "hover:bg-yellow-50 text-yellow-600",
  red:    "hover:bg-red-50    text-red-600",
  purple: "hover:bg-purple-50 text-purple-600",
  indigo: "hover:bg-indigo-50 text-indigo-600",
  pink:   "hover:bg-pink-50   text-pink-600",
};

export const BatchOperationsToolbar = memo<BatchOperationsToolbarProps>(
  ({ selectedCount, onClearSelection, onBatchOperation, userRole }) => {
    if (selectedCount === 0) return null;

    const canDelete = userRole === "admin" || userRole === "editor";
    const canMove   = userRole === "admin" || userRole === "editor";

    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            {/* Selection count */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {selectedCount} selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear selection"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Batch operations */}
            <div className="flex items-center gap-2">
              {BATCH_OPERATIONS.map((operation) => {
                const Icon = operation.icon;
                const isDisabled =
                  (operation.op === "delete" && !canDelete) ||
                  (operation.op === "move"   && !canMove);
                const colorCls = OPERATION_COLOR_CLASSES[operation.color] ?? "";

                return (
                  <button
                    key={operation.op}
                    onClick={() => onBatchOperation(operation.op)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed text-gray-400"
                        : colorCls
                    }`}
                    title={operation.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{operation.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BatchOperationsToolbar.displayName = "BatchOperationsToolbar";