"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBusinessLogic = exports.UserPreferencesSchema = exports.UserProfileSchema = void 0;
var zod_1 = require("zod");
// User validation schemas
exports.UserProfileSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(2, "First name must be at least 2 characters")
        .max(50, "First name must not exceed 50 characters")
        .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
    lastName: zod_1.z
        .string()
        .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name must not exceed 50 characters")
        .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
    email: zod_1.z
        .string()
        .email("Invalid email address")
        .max(255, "Email must not exceed 255 characters"),
    phone: zod_1.z
        .string()
        .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format")
        .min(10, "Phone number must be at least 10 digits")
        .max(20, "Phone number must not exceed 20 characters")
        .optional(),
    avatar: zod_1.z.string().url("Invalid avatar URL").optional(),
    preferences: zod_1.z.object({
        notifications: zod_1.z.object({
            email: zod_1.z.boolean(),
            sms: zod_1.z.boolean(),
            push: zod_1.z.boolean(),
        }),
        privacy: zod_1.z.object({
            showProfile: zod_1.z.boolean(),
            showContactInfo: zod_1.z.boolean(),
        }),
    }),
});
exports.UserPreferencesSchema = zod_1.z.object({
    notifications: zod_1.z.object({
        email: zod_1.z.boolean(),
        sms: zod_1.z.boolean(),
        push: zod_1.z.boolean(),
        frequency: zod_1.z.enum(["immediate", "daily", "weekly"]).default("immediate"),
        types: zod_1.z
            .object({
            propertyUpdates: zod_1.z.boolean().default(true),
            trustAlerts: zod_1.z.boolean().default(true),
            messages: zod_1.z.boolean().default(true),
            marketing: zod_1.z.boolean().default(false),
            systemUpdates: zod_1.z.boolean().default(true),
        })
            .default({}),
    }),
    privacy: zod_1.z.object({
        showProfile: zod_1.z.boolean().default(true),
        showContactInfo: zod_1.z.boolean().default(false),
        showTrustScore: zod_1.z.boolean().default(true),
        allowDirectMessages: zod_1.z.boolean().default(true),
        showActivityStatus: zod_1.z.boolean().default(true),
    }),
    search: zod_1.z
        .object({
        defaultLocation: zod_1.z.string().optional(),
        priceRange: zod_1.z
            .object({
            min: zod_1.z.number().min(0),
            max: zod_1.z.number().min(0),
        })
            .optional(),
        preferredPropertyTypes: zod_1.z
            .array(zod_1.z.enum(["apartment", "house", "condo", "townhouse", "land"]))
            .default([]),
        savedSearches: zod_1.z
            .array(zod_1.z.object({
            name: zod_1.z.string(),
            criteria: zod_1.z.record(zod_1.z.any()),
            alertsEnabled: zod_1.z.boolean(),
        }))
            .default([]),
    })
        .default({}),
});
// User business logic implementation
var UserBusinessLogic = /** @class */ (function () {
    function UserBusinessLogic() {
    }
    // Validate user profile data
    UserBusinessLogic.validateUserProfile = function (data) {
        try {
            var parsed = exports.UserProfileSchema.parse(data);
            var result = {
                firstName: parsed.firstName,
                lastName: parsed.lastName,
                email: parsed.email,
                preferences: parsed.preferences,
            };
            if (parsed.phone !== undefined) {
                result.phone = parsed.phone;
            }
            if (parsed.avatar !== undefined) {
                result.avatar = parsed.avatar;
            }
            return result;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                var errorMessages = error.errors.map(function (err) { return "".concat(err.path.join("."), ": ").concat(err.message); });
                throw new Error("Profile validation failed: ".concat(errorMessages.join(", ")));
            }
            throw error;
        }
    };
    // Validate user preferences
    UserBusinessLogic.validateUserPreferences = function (data) {
        try {
            return exports.UserPreferencesSchema.parse(data);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                var errorMessages = error.errors.map(function (err) { return "".concat(err.path.join("."), ": ").concat(err.message); });
                throw new Error("Preferences validation failed: ".concat(errorMessages.join(", ")));
            }
            throw error;
        }
    };
    // Check user permissions
    UserBusinessLogic.hasPermission = function (user, permission) {
        var userPermissions = this.ROLE_PERMISSIONS[user.role] || [];
        return userPermissions.includes(permission);
    };
    // Check if user can perform action on another user
    UserBusinessLogic.canManageUser = function (currentUser, targetUser) {
        var reasons = [];
        var canManage = true;
        // Check role hierarchy
        var currentUserLevel = this.ROLE_HIERARCHY[currentUser.role];
        var targetUserLevel = this.ROLE_HIERARCHY[targetUser.role];
        if (currentUserLevel <= targetUserLevel &&
            currentUser.id !== targetUser.id) {
            canManage = false;
            reasons.push("Insufficient permissions to manage this user");
        }
        // Admin can manage anyone except other admins (unless it's themselves)
        if (currentUser.role === "admin" &&
            targetUser.role === "admin" &&
            currentUser.id !== targetUser.id) {
            canManage = false;
            reasons.push("Admins cannot manage other admins");
        }
        // Users can only manage themselves
        if (currentUser.role === "user" && currentUser.id !== targetUser.id) {
            canManage = false;
            reasons.push("Users can only manage their own profile");
        }
        return { canManage: canManage, reasons: reasons };
    };
    // Calculate user activity score
    UserBusinessLogic.calculateActivityScore = function (data) {
        var score = 0;
        var factors = {};
        var recommendations = [];
        // Login frequency (0-25 points)
        var loginScore = Math.min(data.loginFrequency * 5, 25);
        factors.loginFrequency = loginScore;
        score += loginScore;
        if (data.loginFrequency < 2) {
            recommendations.push("Log in more frequently to stay updated");
        }
        // Property interactions (0-30 points)
        var interactionScore = Math.min(data.propertyInteractions * 2, 30);
        factors.propertyInteractions = interactionScore;
        score += interactionScore;
        if (data.propertyInteractions < 5) {
            recommendations.push("Explore more properties to find your perfect match");
        }
        // Message activity (0-20 points)
        var messageScore = Math.min(data.messageActivity * 3, 20);
        factors.messageActivity = messageScore;
        score += messageScore;
        if (data.messageActivity < 3) {
            recommendations.push("Engage with property owners and agents");
        }
        // Profile completeness (0-15 points)
        var profileScore = (data.profileCompleteness / 100) * 15;
        factors.profileCompleteness = profileScore;
        score += profileScore;
        if (data.profileCompleteness < 80) {
            recommendations.push("Complete your profile to build trust");
        }
        // Account age bonus (0-5 points)
        var ageScore = Math.min(data.accountAge / 30, 5); // 1 point per month, max 5
        factors.accountAge = ageScore;
        score += ageScore;
        // Verification bonus (0-5 points)
        var verificationScore = (data.verificationLevel / 100) * 5;
        factors.verificationLevel = verificationScore;
        score += verificationScore;
        if (data.verificationLevel < 50) {
            recommendations.push("Complete verification to increase trust");
        }
        // Determine activity level
        var level;
        if (score >= 80) {
            level = "highly_active";
        }
        else if (score >= 60) {
            level = "active";
        }
        else if (score >= 40) {
            level = "moderate";
        }
        else if (score >= 20) {
            level = "low";
        }
        else {
            level = "inactive";
        }
        return {
            score: Math.round(score),
            level: level,
            factors: factors,
            recommendations: recommendations.slice(0, 3), // Top 3 recommendations
        };
    };
    // Generate user insights and recommendations
    UserBusinessLogic.generateUserInsights = function (user, activityData) {
        var insights = [];
        var recommendations = [];
        var achievements = [];
        var goals = [];
        // Generate profile insights
        this.addProfileInsights(user, achievements, goals, recommendations);
        // Generate trust score insights
        this.addTrustScoreInsights(user, insights, achievements, goals, recommendations);
        // Generate verification insights
        this.addVerificationInsights(user, achievements, recommendations, goals);
        // Generate role-specific insights
        this.addRoleInsights(user, insights, recommendations);
        // Generate activity insights
        this.addActivityInsights(activityData, recommendations, achievements);
        return {
            insights: insights.slice(0, 5),
            recommendations: recommendations.slice(0, 5),
            achievements: achievements,
            goals: goals,
        };
    };
    UserBusinessLogic.addProfileInsights = function (user, achievements, goals, recommendations) {
        var profileFields = ["firstName", "lastName", "email", "phone", "avatar"];
        var completedFields = profileFields.filter(function (field) { return user[field]; });
        var completeness = (completedFields.length / profileFields.length) * 100;
        if (completeness >= 100) {
            achievements.push({
                title: "Profile Complete",
                description: "Completed all profile information",
                earnedDate: user.updatedAt.toISOString(),
            });
        }
        else {
            goals.push({
                title: "Complete Profile",
                description: "Fill in all profile information",
                progress: completedFields.length,
                target: profileFields.length,
            });
            recommendations.push("Complete your profile to build trust with other users");
        }
    };
    UserBusinessLogic.addTrustScoreInsights = function (user, insights, achievements, goals, recommendations) {
        if (!user.trustScore)
            return;
        if (user.trustScore >= 800) {
            insights.push("You have an excellent trust score");
            achievements.push({
                title: "Trusted Member",
                description: "Achieved high trust score",
                earnedDate: user.updatedAt.toISOString(),
            });
        }
        else if (user.trustScore >= 600) {
            insights.push("You have a good trust score");
            goals.push({
                title: "Trusted Member",
                description: "Reach trust score of 800",
                progress: user.trustScore,
                target: 800,
            });
        }
        else {
            insights.push("Your trust score has room for improvement");
            recommendations.push("Complete verification steps to improve your trust score");
            goals.push({
                title: "Build Trust",
                description: "Reach trust score of 600",
                progress: user.trustScore,
                target: 600,
            });
        }
    };
    UserBusinessLogic.addVerificationInsights = function (user, achievements, recommendations, goals) {
        if (user.isVerified) {
            achievements.push({
                title: "Verified User",
                description: "Successfully completed account verification",
                earnedDate: user.updatedAt.toISOString(),
            });
        }
        else {
            recommendations.push("Complete account verification to access more features");
            goals.push({
                title: "Get Verified",
                description: "Complete account verification process",
                progress: 0,
                target: 1,
            });
        }
    };
    UserBusinessLogic.addRoleInsights = function (user, insights, recommendations) {
        if (user.role === "agent") {
            insights.push("As an agent, you have access to advanced property management tools");
            if (!user.isVerified) {
                recommendations.push("Agent verification is required to list properties");
            }
        }
    };
    UserBusinessLogic.addActivityInsights = function (activityData, recommendations, achievements) {
        if (!activityData || typeof activityData !== "object")
            return;
        try {
            var activityScore = this.calculateActivityScore(activityData);
            if (activityScore.level === "inactive") {
                recommendations.push("Stay active on the platform to get the best experience");
            }
            else if (activityScore.level === "highly_active") {
                achievements.push({
                    title: "Power User",
                    description: "Highly active platform user",
                    earnedDate: new Date().toISOString(),
                });
            }
            recommendations.push.apply(recommendations, activityScore.recommendations);
        }
        catch (_a) {
            // Ignore activity data if it's malformed
        }
    };
    // Validate user settings update
    UserBusinessLogic.validateSettingsUpdate = function (currentUser, updates, requestingUserId) {
        var errors = [];
        var allowedUpdates = {};
        // Check permissions first
        var permissionCheck = this.checkUpdatePermissions(currentUser, requestingUserId);
        if (!permissionCheck.canUpdate) {
            return {
                isValid: false,
                errors: permissionCheck.errors,
                allowedUpdates: {},
            };
        }
        // Validate each field
        this.validateFieldUpdates(updates, allowedUpdates, errors);
        return {
            isValid: errors.length === 0,
            errors: errors,
            allowedUpdates: allowedUpdates,
        };
    };
    UserBusinessLogic.checkUpdatePermissions = function (currentUser, requestingUserId) {
        if (currentUser.id === requestingUserId) {
            return { canUpdate: true, errors: [] };
        }
        var _a = this.canManageUser({ id: requestingUserId, role: "user" }, currentUser), canManage = _a.canManage, reasons = _a.reasons;
        return { canUpdate: canManage, errors: reasons };
    };
    UserBusinessLogic.validateFieldUpdates = function (updates, allowedUpdates, errors) {
        var _this = this;
        Object.entries(updates).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            _this.validateSingleField(key, value, allowedUpdates, errors);
        });
    };
    UserBusinessLogic.validateSingleField = function (key, value, allowedUpdates, errors) {
        switch (key) {
            case "firstName":
            case "lastName":
                this.validateNameField(key, value, allowedUpdates, errors);
                break;
            case "email":
                this.validateEmailField(value, allowedUpdates, errors);
                break;
            case "phone":
                this.validatePhoneField(value, allowedUpdates, errors);
                break;
            case "avatar":
                this.validateAvatarField(value, allowedUpdates, errors);
                break;
            case "preferences":
                this.validatePreferencesField(value, allowedUpdates, errors);
                break;
            case "role":
                errors.push("Role changes are not allowed through this method");
                break;
            default:
                errors.push("Field '".concat(key, "' cannot be updated"));
        }
    };
    UserBusinessLogic.validateNameField = function (fieldName, value, allowedUpdates, errors) {
        if (typeof value === "string" && value.length >= 2 && value.length <= 50) {
            if (fieldName === "firstName") {
                allowedUpdates.firstName = value;
            }
            else if (fieldName === "lastName") {
                allowedUpdates.lastName = value;
            }
        }
        else {
            errors.push("".concat(fieldName, " must be between 2 and 50 characters"));
        }
    };
    UserBusinessLogic.validateEmailField = function (value, allowedUpdates, errors) {
        if (typeof value === "string" && this.isValidEmail(value)) {
            allowedUpdates.email = value;
        }
        else {
            errors.push("Invalid email format");
        }
    };
    UserBusinessLogic.validatePhoneField = function (value, allowedUpdates, errors) {
        if (!value) {
            // Don't set undefined for optional properties with exactOptionalPropertyTypes
            delete allowedUpdates.phone;
        }
        else if (typeof value === "string" && /^\+?[\d\s\-()]+$/.test(value)) {
            allowedUpdates.phone = value;
        }
        else {
            errors.push("Invalid phone number format");
        }
    };
    UserBusinessLogic.validateAvatarField = function (value, allowedUpdates, errors) {
        if (!value) {
            // Don't set undefined for optional properties with exactOptionalPropertyTypes
            delete allowedUpdates.avatar;
        }
        else if (typeof value === "string" && /^https?:\/\/.+/.test(value)) {
            allowedUpdates.avatar = value;
        }
        else {
            errors.push("Invalid avatar URL");
        }
    };
    UserBusinessLogic.validatePreferencesField = function (value, allowedUpdates, errors) {
        try {
            var validatedPreferences = this.validateUserPreferences(value);
            allowedUpdates.preferences = validatedPreferences;
        }
        catch (error) {
            errors.push("Invalid preferences: ".concat(error));
        }
    };
    // Email validation helper
    UserBusinessLogic.isValidEmail = function (email) {
        // Simple email validation to avoid ReDoS vulnerability
        var emailParts = email.split("@");
        if (emailParts.length !== 2)
            return false;
        var localPart = emailParts[0], domainPart = emailParts[1];
        if (!localPart || !domainPart)
            return false;
        // Basic checks without complex regex
        return (localPart.length > 0 &&
            domainPart.includes(".") &&
            domainPart.length > 3 &&
            !email.includes(" "));
    };
    // Generate user dashboard data
    UserBusinessLogic.generateDashboardData = function (user, recentActivity) {
        // This would typically fetch data from various services
        var summary = {
            totalProperties: 0, // Would be fetched from property service
            activeListings: 0,
            totalMessages: 0, // Would be fetched from message service
            unreadMessages: 0,
            trustScore: user.trustScore || 0,
            verificationStatus: user.isVerified ? "verified" : "pending",
        };
        var quickActions = [];
        // Role-specific quick actions
        if (user.role === "agent") {
            quickActions.push({
                title: "List Property",
                description: "Add a new property listing",
                actionUrl: "/property/list",
                icon: "home",
            }, {
                title: "View Analytics",
                description: "Check your performance metrics",
                actionUrl: "/analytics",
                icon: "chart",
            });
        }
        else {
            quickActions.push({
                title: "Search Properties",
                description: "Find your perfect property",
                actionUrl: "/search",
                icon: "search",
            }, {
                title: "Saved Properties",
                description: "View your saved properties",
                actionUrl: "/saved",
                icon: "heart",
            });
        }
        // Common quick actions
        quickActions.push({
            title: "Messages",
            description: "Check your messages",
            actionUrl: "/inbox",
            icon: "message",
        }, {
            title: "Profile",
            description: "Update your profile",
            actionUrl: "/profile",
            icon: "user",
        });
        var notifications = [];
        // Generate notifications based on user state
        if (!user.isVerified) {
            notifications.push({
                type: "warning",
                title: "Verification Pending",
                message: "Complete your verification to access all features",
                actionUrl: "/verification",
            });
        }
        if (user.trustScore && user.trustScore < 500) {
            notifications.push({
                type: "info",
                title: "Improve Trust Score",
                message: "Complete verification steps to increase your trust score",
                actionUrl: "/trust",
            });
        }
        // Filter and type-check recent activity
        var typedRecentActivity = recentActivity
            .filter(function (item) {
            return (typeof item === "object" &&
                item !== null &&
                typeof item.type === "string" &&
                typeof item.title === "string" &&
                typeof item.description === "string" &&
                typeof item.timestamp === "string");
        })
            .slice(0, 10);
        return {
            summary: summary,
            recentActivity: typedRecentActivity,
            quickActions: quickActions,
            notifications: notifications,
        };
    };
    // User role hierarchy and permissions
    UserBusinessLogic.ROLE_HIERARCHY = {
        user: 0,
        agent: 1,
        admin: 2,
    };
    UserBusinessLogic.ROLE_PERMISSIONS = {
        user: [
            "view_properties",
            "create_property",
            "edit_own_property",
            "send_messages",
            "view_trust_scores",
        ],
        agent: [
            "view_properties",
            "create_property",
            "edit_own_property",
            "edit_client_property",
            "send_messages",
            "view_trust_scores",
            "verify_properties",
            "access_analytics",
        ],
        admin: [
            "view_properties",
            "create_property",
            "edit_any_property",
            "delete_any_property",
            "send_messages",
            "view_trust_scores",
            "edit_trust_scores",
            "verify_properties",
            "access_analytics",
            "manage_users",
            "system_settings",
        ],
    };
    return UserBusinessLogic;
}());
exports.UserBusinessLogic = UserBusinessLogic;
