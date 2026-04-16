import { z } from "zod"

import { User } from "../../auth/types/auth.types"

// User validation schemas
export const UserProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),

  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),

  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters"),

  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must not exceed 20 characters")
    .optional(),

  avatar: z.string().url("Invalid avatar URL").optional(),

  preferences: z.object({
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    }),
    privacy: z.object({
      showProfile: z.boolean(),
      showContactInfo: z.boolean(),
    }),
  }),
});

export const UserPreferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    frequency: z.enum(["immediate", "daily", "weekly"]).default("immediate"),
    types: z
      .object({
        propertyUpdates: z.boolean().default(true),
        trustAlerts: z.boolean().default(true),
        messages: z.boolean().default(true),
        marketing: z.boolean().default(false),
        systemUpdates: z.boolean().default(true),
      })
      .default({}),
  }),
  privacy: z.object({
    showProfile: z.boolean().default(true),
    showContactInfo: z.boolean().default(false),
    showTrustScore: z.boolean().default(true),
    allowDirectMessages: z.boolean().default(true),
    showActivityStatus: z.boolean().default(true),
  }),
  search: z
    .object({
      defaultLocation: z.string().optional(),
      priceRange: z
        .object({
          min: z.number().min(0),
          max: z.number().min(0),
        })
        .optional(),
      preferredPropertyTypes: z
        .array(z.enum(["apartment", "house", "condo", "townhouse", "land"]))
        .default([]),
      savedSearches: z
        .array(
          z.object({
            name: z.string(),
            criteria: z.record(z.any()),
            alertsEnabled: z.boolean(),
          })
        )
        .default([]),
    })
    .default({}),
});

// User business logic implementation
export class UserBusinessLogic {
  // User role hierarchy and permissions
  private static readonly ROLE_HIERARCHY = {
    user: 0,
    agent: 1,
    admin: 2,
  };

  private static readonly ROLE_PERMISSIONS = {
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

  // Validate user profile data
  static validateUserProfile(data: unknown): Partial<User> {
    try {
      const parsed = UserProfileSchema.parse(data);
      const result: Partial<User> = {
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        );
        throw new Error(
          `Profile validation failed: ${errorMessages.join(", ")}`
        );
      }
      throw error;
    }
  }

  // Validate user preferences
  static validateUserPreferences(data: unknown): User["preferences"] {
    try {
      return UserPreferencesSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        );
        throw new Error(
          `Preferences validation failed: ${errorMessages.join(", ")}`
        );
      }
      throw error;
    }
  }

  // Check user permissions
  static hasPermission(user: User, permission: string): boolean {
    const userPermissions = this.ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  }

  // Check if user can perform action on another user
  static canManageUser(
    currentUser: User,
    targetUser: User
  ): {
    canManage: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let canManage = true;

    // Check role hierarchy
    const currentUserLevel = this.ROLE_HIERARCHY[currentUser.role];
    const targetUserLevel = this.ROLE_HIERARCHY[targetUser.role];

    if (
      currentUserLevel <= targetUserLevel &&
      currentUser.id !== targetUser.id
    ) {
      canManage = false;
      reasons.push("Insufficient permissions to manage this user");
    }

    // Admin can manage anyone except other admins (unless it's themselves)
    if (
      currentUser.role === "admin" &&
      targetUser.role === "admin" &&
      currentUser.id !== targetUser.id
    ) {
      canManage = false;
      reasons.push("Admins cannot manage other admins");
    }

    // Users can only manage themselves
    if (currentUser.role === "user" && currentUser.id !== targetUser.id) {
      canManage = false;
      reasons.push("Users can only manage their own profile");
    }

    return { canManage, reasons };
  }

  // Calculate user activity score
  static calculateActivityScore(data: {
    loginFrequency: number; // logins per week
    propertyInteractions: number; // views, saves, inquiries
    messageActivity: number; // messages sent/received
    profileCompleteness: number; // percentage
    accountAge: number; // days since registration
    verificationLevel: number; // 0-100
  }): {
    score: number;
    level: "inactive" | "low" | "moderate" | "active" | "highly_active";
    factors: Record<string, number>;
    recommendations: string[];
  } {
    let score = 0;
    const factors: Record<string, number> = {};
    const recommendations: string[] = [];

    // Login frequency (0-25 points)
    const loginScore = Math.min(data.loginFrequency * 5, 25);
    factors.loginFrequency = loginScore;
    score += loginScore;

    if (data.loginFrequency < 2) {
      recommendations.push("Log in more frequently to stay updated");
    }

    // Property interactions (0-30 points)
    const interactionScore = Math.min(data.propertyInteractions * 2, 30);
    factors.propertyInteractions = interactionScore;
    score += interactionScore;

    if (data.propertyInteractions < 5) {
      recommendations.push(
        "Explore more properties to find your perfect match"
      );
    }

    // Message activity (0-20 points)
    const messageScore = Math.min(data.messageActivity * 3, 20);
    factors.messageActivity = messageScore;
    score += messageScore;

    if (data.messageActivity < 3) {
      recommendations.push("Engage with property owners and agents");
    }

    // Profile completeness (0-15 points)
    const profileScore = (data.profileCompleteness / 100) * 15;
    factors.profileCompleteness = profileScore;
    score += profileScore;

    if (data.profileCompleteness < 80) {
      recommendations.push("Complete your profile to build trust");
    }

    // Account age bonus (0-5 points)
    const ageScore = Math.min(data.accountAge / 30, 5); // 1 point per month, max 5
    factors.accountAge = ageScore;
    score += ageScore;

    // Verification bonus (0-5 points)
    const verificationScore = (data.verificationLevel / 100) * 5;
    factors.verificationLevel = verificationScore;
    score += verificationScore;

    if (data.verificationLevel < 50) {
      recommendations.push("Complete verification to increase trust");
    }

    // Determine activity level
    let level: "inactive" | "low" | "moderate" | "active" | "highly_active";
    if (score >= 80) {
      level = "highly_active";
    } else if (score >= 60) {
      level = "active";
    } else if (score >= 40) {
      level = "moderate";
    } else if (score >= 20) {
      level = "low";
    } else {
      level = "inactive";
    }

    return {
      score: Math.round(score),
      level,
      factors,
      recommendations: recommendations.slice(0, 3), // Top 3 recommendations
    };
  }

  // Generate user insights and recommendations
  static generateUserInsights(
    user: User,
    activityData: unknown
  ): {
    insights: string[];
    recommendations: string[];
    achievements: Array<{
      title: string;
      description: string;
      earnedDate?: string | undefined;
      progress?: number | undefined;
    }>;
    goals: Array<{
      title: string;
      description: string;
      progress: number;
      target: number;
    }>;
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const achievements: Array<{
      title: string;
      description: string;
      earnedDate?: string | undefined;
      progress?: number | undefined;
    }> = [];
    const goals: Array<{
      title: string;
      description: string;
      progress: number;
      target: number;
    }> = [];

    // Generate profile insights
    this.addProfileInsights(user, achievements, goals, recommendations);

    // Generate trust score insights
    this.addTrustScoreInsights(
      user,
      insights,
      achievements,
      goals,
      recommendations
    );

    // Generate verification insights
    this.addVerificationInsights(user, achievements, recommendations, goals);

    // Generate role-specific insights
    this.addRoleInsights(user, insights, recommendations);

    // Generate activity insights
    this.addActivityInsights(activityData, recommendations, achievements);

    return {
      insights: insights.slice(0, 5),
      recommendations: recommendations.slice(0, 5),
      achievements,
      goals,
    };
  }

  private static addProfileInsights(
    user: User,
    achievements: Array<{
      title: string;
      description: string;
      earnedDate?: string | undefined;
    }>,
    goals: Array<{
      title: string;
      description: string;
      progress: number;
      target: number;
    }>,
    recommendations: string[]
  ): void {
    const profileFields = ["firstName", "lastName", "email", "phone", "avatar"];
    const completedFields = profileFields.filter(
      (field) => user[field as keyof User]
    );
    const completeness = (completedFields.length / profileFields.length) * 100;

    if (completeness >= 100) {
      achievements.push({
        title: "Profile Complete",
        description: "Completed all profile information",
        earnedDate: user.updatedAt.toISOString(),
      });
    } else {
      goals.push({
        title: "Complete Profile",
        description: "Fill in all profile information",
        progress: completedFields.length,
        target: profileFields.length,
      });
      recommendations.push(
        "Complete your profile to build trust with other users"
      );
    }
  }

  private static addTrustScoreInsights(
    user: User,
    insights: string[],
    achievements: Array<{
      title: string;
      description: string;
      earnedDate?: string | undefined;
    }>,
    goals: Array<{
      title: string;
      description: string;
      progress: number;
      target: number;
    }>,
    recommendations: string[]
  ): void {
    if (!user.trustScore) return;

    if (user.trustScore >= 800) {
      insights.push("You have an excellent trust score");
      achievements.push({
        title: "Trusted Member",
        description: "Achieved high trust score",
        earnedDate: user.updatedAt.toISOString(),
      });
    } else if (user.trustScore >= 600) {
      insights.push("You have a good trust score");
      goals.push({
        title: "Trusted Member",
        description: "Reach trust score of 800",
        progress: user.trustScore,
        target: 800,
      });
    } else {
      insights.push("Your trust score has room for improvement");
      recommendations.push(
        "Complete verification steps to improve your trust score"
      );
      goals.push({
        title: "Build Trust",
        description: "Reach trust score of 600",
        progress: user.trustScore,
        target: 600,
      });
    }
  }

  private static addVerificationInsights(
    user: User,
    achievements: Array<{
      title: string;
      description: string;
      earnedDate?: string | undefined;
    }>,
    recommendations: string[],
    goals: Array<{
      title: string;
      description: string;
      progress: number;
      target: number;
    }>
  ): void {
    if (user.isVerified) {
      achievements.push({
        title: "Verified User",
        description: "Successfully completed account verification",
        earnedDate: user.updatedAt.toISOString(),
      });
    } else {
      recommendations.push(
        "Complete account verification to access more features"
      );
      goals.push({
        title: "Get Verified",
        description: "Complete account verification process",
        progress: 0,
        target: 1,
      });
    }
  }

  private static addRoleInsights(
    user: User,
    insights: string[],
    recommendations: string[]
  ): void {
    if (user.role === "agent") {
      insights.push(
        "As an agent, you have access to advanced property management tools"
      );
      if (!user.isVerified) {
        recommendations.push(
          "Agent verification is required to list properties"
        );
      }
    }
  }

  private static addActivityInsights(
    activityData: unknown,
    recommendations: string[],
    achievements: Array<{
      title: string;
      description: string;
      earnedDate?: string | undefined;
    }>
  ): void {
    if (!activityData || typeof activityData !== "object") return;

    try {
      const activityScore = this.calculateActivityScore(
        activityData as {
          loginFrequency: number;
          propertyInteractions: number;
          messageActivity: number;
          profileCompleteness: number;
          accountAge: number;
          verificationLevel: number;
        }
      );

      if (activityScore.level === "inactive") {
        recommendations.push(
          "Stay active on the platform to get the best experience"
        );
      } else if (activityScore.level === "highly_active") {
        achievements.push({
          title: "Power User",
          description: "Highly active platform user",
          earnedDate: new Date().toISOString(),
        });
      }

      recommendations.push(...activityScore.recommendations);
    } catch {
      // Ignore activity data if it's malformed
    }
  }

  // Validate user settings update
  static validateSettingsUpdate(
    currentUser: User,
    updates: Partial<User>,
    requestingUserId: string
  ): {
    isValid: boolean;
    errors: string[];
    allowedUpdates: Partial<User>;
  } {
    const errors: string[] = [];
    const allowedUpdates: Partial<User> = {};

    // Check permissions first
    const permissionCheck = this.checkUpdatePermissions(
      currentUser,
      requestingUserId
    );
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
      errors,
      allowedUpdates,
    };
  }

  private static checkUpdatePermissions(
    currentUser: User,
    requestingUserId: string
  ): {
    canUpdate: boolean;
    errors: string[];
  } {
    if (currentUser.id === requestingUserId) {
      return { canUpdate: true, errors: [] };
    }

    const { canManage, reasons } = this.canManageUser(
      { id: requestingUserId, role: "user" } as User,
      currentUser
    );

    return { canUpdate: canManage, errors: reasons };
  }

  private static validateFieldUpdates(
    updates: Partial<User>,
    allowedUpdates: Partial<User>,
    errors: string[]
  ): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.validateSingleField(key, value, allowedUpdates, errors);
    });
  }

  private static validateSingleField(
    key: string,
    value: unknown,
    allowedUpdates: Partial<User>,
    errors: string[]
  ): void {
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
        errors.push(`Field '${key}' cannot be updated`);
    }
  }

  private static validateNameField(
    fieldName: string,
    value: unknown,
    allowedUpdates: Partial<User>,
    errors: string[]
  ): void {
    if (typeof value === "string" && value.length >= 2 && value.length <= 50) {
      if (fieldName === "firstName") {
        allowedUpdates.firstName = value;
      } else if (fieldName === "lastName") {
        allowedUpdates.lastName = value;
      }
    } else {
      errors.push(`${fieldName} must be between 2 and 50 characters`);
    }
  }

  private static validateEmailField(
    value: unknown,
    allowedUpdates: Partial<User>,
    errors: string[]
  ): void {
    if (typeof value === "string" && this.isValidEmail(value)) {
      allowedUpdates.email = value;
    } else {
      errors.push("Invalid email format");
    }
  }

  private static validatePhoneField(
    value: unknown,
    allowedUpdates: Partial<User>,
    errors: string[]
  ): void {
    if (!value) {
      // Don't set undefined for optional properties with exactOptionalPropertyTypes
      delete (allowedUpdates as Record<string, unknown>).phone;
    } else if (typeof value === "string" && /^\+?[\d\s\-()]+$/.test(value)) {
      allowedUpdates.phone = value;
    } else {
      errors.push("Invalid phone number format");
    }
  }

  private static validateAvatarField(
    value: unknown,
    allowedUpdates: Partial<User>,
    errors: string[]
  ): void {
    if (!value) {
      // Don't set undefined for optional properties with exactOptionalPropertyTypes
      delete (allowedUpdates as Record<string, unknown>).avatar;
    } else if (typeof value === "string" && /^https?:\/\/.+/.test(value)) {
      allowedUpdates.avatar = value;
    } else {
      errors.push("Invalid avatar URL");
    }
  }

  private static validatePreferencesField(
    value: unknown,
    allowedUpdates: Partial<User>,
    errors: string[]
  ): void {
    try {
      const validatedPreferences = this.validateUserPreferences(value);
      allowedUpdates.preferences = validatedPreferences;
    } catch (error) {
      errors.push(`Invalid preferences: ${error}`);
    }
  }

  // Email validation helper
  private static isValidEmail(email: string): boolean {
    // Simple email validation to avoid ReDoS vulnerability
    const emailParts = email.split("@");
    if (emailParts.length !== 2) return false;

    const [localPart, domainPart] = emailParts;
    if (!localPart || !domainPart) return false;

    // Basic checks without complex regex
    return (
      localPart.length > 0 &&
      domainPart.includes(".") &&
      domainPart.length > 3 &&
      !email.includes(" ")
    );
  }

  // Generate user dashboard data
  static generateDashboardData(
    user: User,
    recentActivity: unknown[]
  ): {
    summary: {
      totalProperties: number;
      activeListings: number;
      totalMessages: number;
      unreadMessages: number;
      trustScore: number;
      verificationStatus: string;
    };
    recentActivity: Array<{
      type: string;
      title: string;
      description: string;
      timestamp: string;
      actionUrl?: string;
    }>;
    quickActions: Array<{
      title: string;
      description: string;
      actionUrl: string;
      icon: string;
    }>;
    notifications: Array<{
      type: "info" | "warning" | "success" | "error";
      title: string;
      message: string;
      actionUrl?: string;
    }>;
  } {
    // This would typically fetch data from various services
    const summary = {
      totalProperties: 0, // Would be fetched from property service
      activeListings: 0,
      totalMessages: 0, // Would be fetched from message service
      unreadMessages: 0,
      trustScore: user.trustScore || 0,
      verificationStatus: user.isVerified ? "verified" : "pending",
    };

    const quickActions = [];

    // Role-specific quick actions
    if (user.role === "agent") {
      quickActions.push(
        {
          title: "List Property",
          description: "Add a new property listing",
          actionUrl: "/property/list",
          icon: "home",
        },
        {
          title: "View Analytics",
          description: "Check your performance metrics",
          actionUrl: "/analytics",
          icon: "chart",
        }
      );
    } else {
      quickActions.push(
        {
          title: "Search Properties",
          description: "Find your perfect property",
          actionUrl: "/search",
          icon: "search",
        },
        {
          title: "Saved Properties",
          description: "View your saved properties",
          actionUrl: "/saved",
          icon: "heart",
        }
      );
    }

    // Common quick actions
    quickActions.push(
      {
        title: "Messages",
        description: "Check your messages",
        actionUrl: "/inbox",
        icon: "message",
      },
      {
        title: "Profile",
        description: "Update your profile",
        actionUrl: "/profile",
        icon: "user",
      }
    );

    const notifications = [];

    // Generate notifications based on user state
    if (!user.isVerified) {
      notifications.push({
        type: "warning" as const,
        title: "Verification Pending",
        message: "Complete your verification to access all features",
        actionUrl: "/verification",
      });
    }

    if (user.trustScore && user.trustScore < 500) {
      notifications.push({
        type: "info" as const,
        title: "Improve Trust Score",
        message: "Complete verification steps to increase your trust score",
        actionUrl: "/trust",
      });
    }

    // Filter and type-check recent activity
    const typedRecentActivity = recentActivity
      .filter(
        (
          item
        ): item is {
          type: string;
          title: string;
          description: string;
          timestamp: string;
          actionUrl?: string;
        } => {
          return (
            typeof item === "object" &&
            item !== null &&
            typeof (item as Record<string, unknown>).type === "string" &&
            typeof (item as Record<string, unknown>).title === "string" &&
            typeof (item as Record<string, unknown>).description === "string" &&
            typeof (item as Record<string, unknown>).timestamp === "string"
          );
        }
      )
      .slice(0, 10);

    return {
      summary,
      recentActivity: typedRecentActivity,
      quickActions,
      notifications,
    };
  }
}
