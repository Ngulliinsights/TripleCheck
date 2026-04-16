"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = void 0;
var base_error_1 = require("./base-error");
var error_categories_1 = require("../constants/error-categories");
var http_status_1 = require("../constants/http-status");
var postgres_codes_1 = require("../constants/postgres-codes");
var DatabaseError = /** @class */ (function (_super) {
    __extends(DatabaseError, _super);
    function DatabaseError(message, code, details, correlationId, constraint, table, column) {
        if (code === void 0) { code = 'DATABASE_CONNECTION_FAILED'; }
        var _this = _super.call(this, code, message, http_status_1.HttpStatusCode.INTERNAL_SERVER_ERROR, error_categories_1.ErrorCategory.DATABASE, __assign(__assign({ severity: base_error_1.ErrorSeverity.CRITICAL, recoveryStrategies: [base_error_1.RecoveryStrategy.RETRY, base_error_1.RecoveryStrategy.CONTACT_SUPPORT] }, (details && { details: details })), (correlationId && { correlationId: correlationId }))) || this;
        _this.constraint = constraint;
        _this.table = table;
        _this.column = column;
        return _this;
    }
    DatabaseError.fromPostgres = function (pgError, correlationId) {
        var _a = pgError || {}, code = _a.code, constraint = _a.constraint, table = _a.table, column = _a.column, detail = _a.detail;
        var message = 'Database operation failed';
        var errorCode = 'DATABASE_CONNECTION_FAILED';
        switch (code) {
            case postgres_codes_1.PostgreSQLErrorCode.UNIQUE_VIOLATION:
                message = 'Record already exists';
                errorCode = 'DUPLICATE_RECORD';
                break;
            case postgres_codes_1.PostgreSQLErrorCode.FOREIGN_KEY_VIOLATION:
                message = 'Referenced record does not exist';
                errorCode = 'CONSTRAINT_VIOLATION';
                break;
            case postgres_codes_1.PostgreSQLErrorCode.NOT_NULL_VIOLATION:
                message = column ? "".concat(column, " is required") : 'Required fields are missing';
                errorCode = 'NOT_NULL_VIOLATION';
                break;
        }
        return new DatabaseError(message, errorCode, __assign({ postgresCode: code }, (detail && { detail: detail })), correlationId, constraint, table, column);
    };
    return DatabaseError;
}(base_error_1.AppError));
exports.DatabaseError = DatabaseError;
