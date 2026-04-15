/**
 * Batch Operations Toolbar Component
 * Provides bulk actions for selected images
 */

import React, { memo, useCallback } from "react";
import { X } from "lucide-react";
import { BATCH_OPERATIONS } from "./constants";

interface BatchOperationsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchOperation: (operation: string) => void;
  userRole: string;
}

export const BatchOperationsToolbar = memo<BatchOperationsToolbarProps>(
  ({ selectedCount, onClearSelection, onBatchOperation, userRole }) => {
    const handleOperation = useCallback(
      (operation: string) => {
        onBatchOperation(operation);
      },
      [onBatchOperation]
    );

    if (selectedCount === 0) {
      return null;
    }

    const canDelete = userRole === "admin" || userRole === "editor";
    const canMove = userRole === "admin" || userRole === "editor";

    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            {/* Selection count */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {selectedCount} selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-gray-400 hover:text-gray-600"
                title="Clear selection"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300" />

            {/* Batch operations */}
            <div className="flex items-center gap-2">
              {BATCH_OPERATIONS.map((operation) => {
                const Icon = operation.icon;
                const isDisabled =
                  (operation.op === "delete" && !canDelete) ||
                  (operation.op === "move" && !canMove);

                return (
                  <button
                    key={operation.op}
                    onClick={() => handleOperation(operation.op)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : `hover:bg-${operation.color}-50 text-${operation.color}-600`
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
