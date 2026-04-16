"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormField = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var input_1 = require("../ui/input");
var label_1 = require("../ui/label");
var textarea_1 = require("../ui/textarea");
var cn_1 = require("../../utils/cn");
var FormField = function (_a) {
    var label = _a.label, name = _a.name, _b = _a.type, type = _b === void 0 ? 'text' : _b, value = _a.value, onChange = _a.onChange, onBlur = _a.onBlur, error = _a.error, touched = _a.touched, _c = _a.required, required = _c === void 0 ? false : _c, placeholder = _a.placeholder, _d = _a.disabled, disabled = _d === void 0 ? false : _d, className = _a.className, inputClassName = _a.inputClassName, labelClassName = _a.labelClassName, errorClassName = _a.errorClassName, helpText = _a.helpText, options = _a.options, _e = _a.rows, rows = _e === void 0 ? 4 : _e, min = _a.min, max = _a.max, step = _a.step, autoComplete = _a.autoComplete, ariaDescribedBy = _a["aria-describedby"], ariaInvalid = _a["aria-invalid"];
    var hasError = touched && error;
    var isValid = touched && !error && value;
    var fieldId = "field-".concat(name);
    var errorId = "".concat(fieldId, "-error");
    var helpId = "".concat(fieldId, "-help");
    var baseInputClasses = (0, cn_1.cn)('transition-colors duration-200', hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500', isValid && 'border-green-500 focus:border-green-500 focus:ring-green-500', disabled && 'opacity-50 cursor-not-allowed', inputClassName);
    var renderInput = function () {
        var commonProps = {
            id: fieldId,
            name: name,
            value: value || '',
            onChange: onChange,
            onBlur: onBlur,
            disabled: disabled,
            required: required,
            placeholder: placeholder,
            className: baseInputClasses,
            'aria-invalid': ariaInvalid || hasError,
            'aria-describedby': (0, cn_1.cn)(ariaDescribedBy, hasError && errorId, helpText && helpId).trim() || undefined,
            autoComplete: autoComplete,
        };
        switch (type) {
            case 'textarea':
                return (<textarea_1.Textarea {...commonProps} rows={rows}/>);
            case 'select':
                return (<select {...commonProps} className={(0, cn_1.cn)('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', baseInputClasses)}>
            {placeholder && (<option value="" disabled>
                {placeholder}
              </option>)}
            {options === null || options === void 0 ? void 0 : options.map(function (option) { return (<option key={option.value} value={option.value}>
                {option.label}
              </option>); })}
          </select>);
            case 'number':
                return (<input_1.Input {...commonProps} type="number" min={min} max={max} step={step}/>);
            default:
                return (<input_1.Input {...commonProps} type={type}/>);
        }
    };
    return (<div className={(0, cn_1.cn)('space-y-2', className)}>
      <label_1.Label htmlFor={fieldId} className={(0, cn_1.cn)('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', hasError && 'text-red-600', isValid && 'text-green-600', labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label_1.Label>

      <div className="relative">
        {renderInput()}
        
        {/* Validation icons */}
        {(hasError || isValid) && (<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {hasError && (<lucide_react_1.AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true"/>)}
            {isValid && (<lucide_react_1.CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true"/>)}
          </div>)}
      </div>

      {/* Help text */}
      {helpText && !hasError && (<p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>)}

      {/* Error message */}
      {hasError && (<p id={errorId} className={(0, cn_1.cn)('text-xs text-red-600 flex items-center gap-1', errorClassName)} role="alert" aria-live="polite">
          <lucide_react_1.AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true"/>
          {error}
        </p>)}
    </div>);
};
exports.FormField = FormField;
exports.default = exports.FormField;
