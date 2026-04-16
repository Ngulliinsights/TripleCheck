"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgreSQLErrorCode = void 0;
/**
 * PostgreSQL specific error codes
 */
var PostgreSQLErrorCode;
(function (PostgreSQLErrorCode) {
    PostgreSQLErrorCode["UNIQUE_VIOLATION"] = "23505";
    PostgreSQLErrorCode["FOREIGN_KEY_VIOLATION"] = "23503";
    PostgreSQLErrorCode["NOT_NULL_VIOLATION"] = "23502";
    PostgreSQLErrorCode["CHECK_VIOLATION"] = "23514";
    PostgreSQLErrorCode["CONNECTION_FAILURE"] = "08000";
    PostgreSQLErrorCode["INVALID_CATALOG_NAME"] = "3D000";
    PostgreSQLErrorCode["INSUFFICIENT_PRIVILEGE"] = "42501";
})(PostgreSQLErrorCode || (exports.PostgreSQLErrorCode = PostgreSQLErrorCode = {}));
