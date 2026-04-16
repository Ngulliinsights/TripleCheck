"use strict";
/**
 * Batch Operations Toolbar Component
 * Provides bulk actions for selected images
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchOperationsToolbar = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var constants_1 = require("./constants");
exports.BatchOperationsToolbar = (0, react_1.memo)(function (_a) {
    var selectedCount = _a.selectedCount, onClearSelection = _a.onClearSelection, onBatchOperation = _a.onBatchOperation, userRole = _a.userRole;
    var handleOperation = (0, react_1.useCallback)(function (operation) {
        onBatchOperation(operation);
    }, [onBatchOperation]);
    if (selectedCount === 0) {
        return null;
    }
    var canDelete = userRole === "admin" || userRole === "editor";
    var canMove = userRole === "admin" || userRole === "editor";
    return (<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            {/* Selection count */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {selectedCount} selected
              </span>
              <button onClick={onClearSelection} className="text-gray-400 hover:text-gray-600" title="Clear selection">
                <lucide_react_1.X className="w-5 h-5"/>
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300"/>

            {/* Batch operations */}
            <div className="flex items-center gap-2">
              {constants_1.BATCH_OPERATIONS.map(function (operation) {
            var Icon = operation.icon;
            var isDisabled = (operation.op === "delete" && !canDelete) ||
                (operation.op === "move" && !canMove);
            return (<button key={operation.op} onClick={function () { return handleOperation(operation.op); }} disabled={isDisabled} className={"flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ".concat(isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-".concat(operation.color, "-50 text-").concat(operation.color, "-600"))} title={operation.label}>
                    <Icon className="w-5 h-5"/>
                    <span className="text-sm font-medium">{operation.label}</span>
                  </button>);
        })}
            </div>
          </div>
        </div>
      </div>);
});
exports.BatchOperationsToolbar.displayName = "BatchOperationsToolbar";
