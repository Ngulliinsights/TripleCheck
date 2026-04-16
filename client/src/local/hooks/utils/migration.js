"use strict";
/**
 * Migration utilities for hook consolidation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formConfigPresets = exports.migrationMappings = void 0;
exports.getMigrationMapping = getMigrationMapping;
exports.analyzeProject = analyzeProject;
exports.getFormConfigPreset = getFormConfigPreset;
/**
 * Migration mappings for hook consolidation
 */
exports.migrationMappings = [
    {
        oldHook: 'useForm',
        newHook: 'useFormValidation',
        changes: {
            imports: {
                from: "import { useForm } from '../hooks/useForm'",
                to: "import { useFormValidation } from '../useFormValidation'"
            },
            apiChanges: [
                {
                    old: 'useForm({ initialValues, validationRules })',
                    new: 'useFormValidation(formConfig)'
                },
                {
                    old: 'const { values, errors, handleSubmit } = useForm(...)',
                    new: 'const { values, errors, handleSubmit } = useFormValidation(...)'
                }
            ],
            configChanges: {
                old: {
                    initialValues: { name: '' },
                    validationRules: { name: { required: true } }
                },
                new: {
                    name: {
                        initialValue: '',
                        rules: { required: true }
                    }
                }
            }
        }
    },
    {
        oldHook: 'useAccessibility',
        newHook: 'useAccessibility (comprehensive)',
        changes: {
            imports: {
                from: "import { useAccessibility } from '../useAccessibility'",
                to: "import { useAccessibility } from '../useAccessibility'"
            },
            apiChanges: [
                {
                    old: 'const { trapFocus, announceLiveRegion } = useAccessibility()',
                    new: 'const { trapFocus, announceLiveRegion, prefersReducedMotion, keyboardNavigation } = useAccessibility()'
                }
            ]
        }
    },
    {
        oldHook: 'usePerformanceMonitor',
        newHook: 'useComponentPerformance',
        changes: {
            imports: {
                from: "import { usePerformanceMonitor } from '../../../property/utils/performanceMonitor'",
                to: "import { useComponentPerformance } from '../useComponentPerformance'"
            },
            apiChanges: [
                {
                    old: 'usePerformanceMonitor({ componentName, enabled, threshold })',
                    new: 'useComponentPerformance(componentName, trackRenders)'
                }
            ]
        }
    },
    {
        oldHook: 'useVirtualizationHelpers',
        newHook: 'useMemoryOptimization (useVirtualization)',
        changes: {
            imports: {
                from: "import { usePropertyListVirtualization } from '../useMemoryOptimization'",
                to: "import { useVirtualization } from '../useMemoryOptimization'"
            },
            apiChanges: [
                {
                    old: 'usePropertyListVirtualization(properties, containerHeight, itemHeight)',
                    new: 'useVirtualization(properties, { itemHeight, containerHeight })'
                }
            ]
        }
    },
    {
        oldHook: 'usePaginatedQuery',
        newHook: 'usePagination',
        changes: {
            imports: {
                from: "import { usePaginatedQuery } from '../usePagination'",
                to: "import { usePagination } from '../usePagination'"
            },
            apiChanges: [
                {
                    old: 'usePaginatedQuery({ queryKey, fetcher, filters, sortBy })',
                    new: 'usePagination({ mode: "paginated", queryKey, fetcher, filters, sortBy })'
                }
            ]
        }
    },
    {
        oldHook: 'useInfiniteScroll',
        newHook: 'usePagination',
        changes: {
            imports: {
                from: "import { useInfiniteScroll } from '../usePagination'",
                to: "import { usePagination } from '../usePagination'"
            },
            apiChanges: [
                {
                    old: 'useInfiniteScroll({ queryKey, queryFn, threshold })',
                    new: 'usePagination({ mode: "infinite", queryKey, fetcher, threshold })'
                }
            ]
        }
    }
];
/**
 * Get migration mapping for a specific hook
 */
function getMigrationMapping(hookName) {
    return exports.migrationMappings.find(function (mapping) { return mapping.oldHook === hookName; });
}
/**
 * Analyze project for deprecated hook usage
 */
function analyzeProject(projectPath) {
    // This would be implemented as a CLI tool or build script
    // For now, return a placeholder structure
    return {
        totalFiles: 0,
        deprecatedHooksFound: [],
        migrationSuggestions: []
    };
}
/**
 * Configuration presets for common form patterns
 */
exports.formConfigPresets = {
    propertyForm: {
        title: {
            initialValue: '',
            rules: {
                required: 'Property title is required',
                minLength: { value: 10, message: 'Title must be at least 10 characters' },
                maxLength: { value: 100, message: 'Title must be no more than 100 characters' },
            },
            validateOnChange: true,
            debounceMs: 500,
        },
        description: {
            initialValue: '',
            rules: {
                required: 'Property description is required',
                minLength: { value: 50, message: 'Description must be at least 50 characters' },
                maxLength: { value: 2000, message: 'Description must be no more than 2000 characters' },
            },
            validateOnBlur: true,
        },
        price: {
            initialValue: '',
            rules: {
                required: 'Price is required',
                min: { value: 1000, message: 'Price must be at least KES 1,000' },
                max: { value: 1000000000, message: 'Price must be reasonable' },
                custom: function (value) {
                    var numValue = Number(value);
                    if (isNaN(numValue))
                        return 'Price must be a valid number';
                    return true;
                },
            },
            transform: function (value) { return Number(value) || 0; },
            validateOnChange: true,
        },
        location: {
            initialValue: '',
            rules: {
                required: 'Location is required',
                minLength: { value: 5, message: 'Location must be at least 5 characters' },
            },
            validateOnBlur: true,
        },
        bedrooms: {
            initialValue: 1,
            rules: {
                required: 'Number of bedrooms is required',
                min: { value: 0, message: 'Bedrooms cannot be negative' },
                max: { value: 20, message: 'Maximum 20 bedrooms allowed' },
            },
            transform: function (value) { return Number(value) || 0; },
        },
        bathrooms: {
            initialValue: 1,
            rules: {
                required: 'Number of bathrooms is required',
                min: { value: 0, message: 'Bathrooms cannot be negative' },
                max: { value: 20, message: 'Maximum 20 bathrooms allowed' },
            },
            transform: function (value) { return Number(value) || 0; },
        },
        propertyType: {
            initialValue: '',
            rules: {
                required: 'Property type is required',
                custom: function (value) {
                    var validTypes = ['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial'];
                    return validTypes.includes(value) || 'Please select a valid property type';
                },
            },
        },
        contactEmail: {
            initialValue: '',
            rules: {
                required: 'Contact email is required',
                email: 'Please enter a valid email address',
            },
            validateOnBlur: true,
            debounceMs: 1000,
        },
        contactPhone: {
            initialValue: '',
            rules: {
                required: 'Contact phone is required',
                pattern: {
                    value: /^(\+254|0)[17]\d{8}$/,
                    message: 'Please enter a valid Kenyan phone number',
                },
            },
            validateOnBlur: true,
        },
    },
    userRegistration: {
        firstName: {
            initialValue: '',
            rules: {
                required: 'First name is required',
                minLength: { value: 2, message: 'First name must be at least 2 characters' },
                pattern: {
                    value: /^[a-zA-Z\s]+$/,
                    message: 'First name can only contain letters and spaces',
                },
            },
            validateOnBlur: true,
        },
        lastName: {
            initialValue: '',
            rules: {
                required: 'Last name is required',
                minLength: { value: 2, message: 'Last name must be at least 2 characters' },
                pattern: {
                    value: /^[a-zA-Z\s]+$/,
                    message: 'Last name can only contain letters and spaces',
                },
            },
            validateOnBlur: true,
        },
        email: {
            initialValue: '',
            rules: {
                required: 'Email is required',
                email: 'Please enter a valid email address',
            },
            validateOnBlur: true,
            debounceMs: 1000,
        },
        password: {
            initialValue: '',
            rules: {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                custom: function (password) {
                    var hasUpperCase = /[A-Z]/.test(password);
                    var hasLowerCase = /[a-z]/.test(password);
                    var hasNumbers = /\d/.test(password);
                    var hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
                    if (!hasUpperCase)
                        return 'Password must contain at least one uppercase letter';
                    if (!hasLowerCase)
                        return 'Password must contain at least one lowercase letter';
                    if (!hasNumbers)
                        return 'Password must contain at least one number';
                    if (!hasSpecialChar)
                        return 'Password must contain at least one special character';
                    return true;
                },
            },
            validateOnChange: true,
            debounceMs: 500,
        },
        confirmPassword: {
            initialValue: '',
            rules: {
                required: 'Please confirm your password',
                custom: function (confirmPassword, formData) {
                    return confirmPassword === formData.password || 'Passwords do not match';
                },
            },
            validateOnChange: true,
            debounceMs: 300,
        },
        phone: {
            initialValue: '',
            rules: {
                required: 'Phone number is required',
                pattern: {
                    value: /^(\+254|0)[17]\d{8}$/,
                    message: 'Please enter a valid Kenyan phone number',
                },
            },
            validateOnBlur: true,
        },
        agreeToTerms: {
            initialValue: false,
            rules: {
                custom: function (agreed) { return agreed || 'You must agree to the terms and conditions'; },
            },
        },
    }
};
/**
 * Get form configuration preset
 */
function getFormConfigPreset(presetName) {
    return exports.formConfigPresets[presetName];
}
