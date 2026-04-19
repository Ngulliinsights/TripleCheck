import { z } from "zod";
import { User, UserRole } from "@shared/types/auth.types";

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

const NotificationsSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
});

const PrivacyBaseSchema = z.object({
  showProfile: z.boolean(),
  showContactInfo: z.boolean(),
});

// ─── Validation schemas ───────────────────────────────────────────────────────

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

  email: z.string().email("Invalid email address").max(255, "Email must not exceed 255 characters"),

  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must not exceed 20 characters")
    .optional(),

  avatar: z.string().url("Invalid avatar URL").optional(),

  preferences: z.object({
    notifications: NotificationsSchema,
    privacy: PrivacyBaseSchema,
  }),
});

export const UserPreferencesSchema = z.object({
  notifications: NotificationsSchema.extend({
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
  privacy: PrivacyBaseSchema.extend({
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
            criteria: z.record(z.unknown()),
            alertsEnabled: z.boolean(),
          })
        )
        .default([]),
    })
    .default({}),
});

// ─── Derived types ────────────────────────────────────────────────────────────

type UserProfile = z.infer<typeof UserProfileSchema>;
type UserPreferences = z.infer<typeof UserPreferencesSchema>;

type ActivityData = {
  loginFrequency: number;
  propertyInteractions: number;
  messageActivity: number;
  profileCompleteness: number;
  accountAge: number;
  verificationLevel: number;
};

type ActivityLevel = "inactive" | "low" | "moderate" | "active" | "highly_active";

type Achievement = {
  title: string;
  description: string;
  earnedDate?: string;
  progress?: number;
};

type Goal = {
  title: string;
  description: string;
  progress: number;
  target: number;
};

type ActivityScore = {
  score: number;
  level: ActivityLevel;
  factors: Record<string, number>;
  recommendations: string[];
};

type Notification = {
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  actionUrl?: string;
};

type QuickAction = {
  title: string;
  description: string;
  actionUrl: string;
  icon: string;
};

type RecentActivityItem = {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Readonly<Record<UserRole, number>> = {
  user: 0,
  agent: 1,
  admin: 2,
};

const ROLE_PERMISSIONS: Readonly<Record<UserRole, readonly string[]>> = {
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

const PROFILE_FIELDS: ReadonlyArray<keyof User> = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "avatar",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const messages = result.error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
  throw new Error(`${context} validation failed: ${messages}`);
}

function isValidEmail(email: string): boolean {
  const [local, domain, ...rest] = email.split("@");
  return (
    rest.length === 0 &&
    Boolean(local) &&
    Boolean(domain) &&
    domain.includes(".") &&
    domain.length > 3 &&
    !email.includes(" ")
  );
}

function isValidUrl(value: string): boolean {
  return /^https?:\/\/.+/.test(value);
}

function isValidPhone(value: string): boolean {
  return /^\+?[\d\s\-()]+$/.test(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isRecentActivityItem(item: unknown): item is RecentActivityItem {
  if (!item || typeof item !== "object") return false;
  const r = item as Record<string, unknown>;
  return (
    typeof r.type === "string" &&
    typeof r.title === "string" &&
    typeof r.description === "string" &&
    typeof r.timestamp === "string"
  );
}

// ─── UserBusinessLogic ────────────────────────────────────────────────────────

export class UserBusinessLogic {
  // ── Validation ──────────────────────────────────────────────────────────────

  static validateUserProfile(data: unknown): Partial<User> {
    const parsed = parseSchema(UserProfileSchema, data, "Profile");
    const result: Partial<User> = {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      preferences: parsed.preferences as User["preferences"],
    };
    if (parsed.phone !== undefined) result.phone = parsed.phone;
    if (parsed.avatar !== undefined) result.avatar = parsed.avatar;
    return result;
  }

  static validateUserPreferences(data: unknown): UserPreferences {
    return parseSchema(UserPreferencesSchema, data, "Preferences") as UserPreferences;
  }

  // ── Permissions ─────────────────────────────────────────────────────────────

  static hasPermission(user: User, permission: string): boolean {
    return (ROLE_PERMISSIONS[user.role] ?? []).includes(permission);
  }

  static canManageUser(
    currentUser: User,
    targetUser: User
  ): { canManage: boolean; reasons: string[] } {
    if (currentUser.id === targetUser.id) return { canManage: true, reasons: [] };

    const reasons: string[] = [];

    if (ROLE_HIERARCHY[currentUser.role] <= ROLE_HIERARCHY[targetUser.role]) {
      reasons.push("Insufficient permissions to manage this user");
    }

    if (currentUser.role === "admin" && targetUser.role === "admin") {
      reasons.push("Admins cannot manage other admins");
    }

    if (currentUser.role === "user") {
      reasons.push("Users can only manage their own profile");
    }

    return { canManage: reasons.length === 0, reasons };
  }

  // ── Activity Score ───────────────────────────────────────────────────────────

  static calculateActivityScore(data: ActivityData): ActivityScore {
    const recommendations: string[] = [];
    const factors: Record<string, number> = {};

    const scoringRules: Array<{
      key: keyof ActivityData;
      compute: (v: number) => number;
      threshold: number;
      tip: string;
    }> = [
      {
        key: "loginFrequency",
        compute: (v) => clamp(v * 5, 0, 25),
        threshold: 2,
        tip: "Log in more frequently to stay updated",
      },
      {
        key: "propertyInteractions",
        compute: (v) => clamp(v * 2, 0, 30),
        threshold: 5,
        tip: "Explore more properties to find your perfect match",
      },
      {
        key: "messageActivity",
        compute: (v) => clamp(v * 3, 0, 20),
        threshold: 3,
        tip: "Engage with property owners and agents",
      },
      {
        key: "profileCompleteness",
        compute: (v) => (v / 100) * 15,
        threshold: 80,
        tip: "Complete your profile to build trust",
      },
      {
        key: "accountAge",
        compute: (v) => clamp(v / 30, 0, 5),
        threshold: Infinity,
        tip: "",
      },
      {
        key: "verificationLevel",
        compute: (v) => (v / 100) * 5,
        threshold: 50,
        tip: "Complete verification to increase trust",
      },
    ];

    let score = 0;
    for (const rule of scoringRules) {
      const pts = rule.compute(data[rule.key]);
      factors[rule.key] = pts;
      score += pts;
      if (rule.tip && data[rule.key] < rule.threshold) {
        recommendations.push(rule.tip);
      }
    }

    const level: ActivityLevel =
      score >= 80 ? "highly_active"
      : score >= 60 ? "active"
      : score >= 40 ? "moderate"
      : score >= 20 ? "low"
      : "inactive";

    return {
      score: Math.round(score),
      level,
      factors,
      recommendations: recommendations.slice(0, 3),
    };
  }

  // ── User Insights ────────────────────────────────────────────────────────────

  static generateUserInsights(
    user: User,
    activityData: unknown
  ): {
    insights: string[];
    recommendations: string[];
    achievements: Achievement[];
    goals: Goal[];
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const achievements: Achievement[] = [];
    const goals: Goal[] = [];

    const now = user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString();

    // Profile completeness
    const completed = PROFILE_FIELDS.filter((f) => Boolean(user[f]));
    if (completed.length === PROFILE_FIELDS.length) {
      achievements.push({
        title: "Profile Complete",
        description: "Completed all profile information",
        earnedDate: now,
      });
    } else {
      goals.push({
        title: "Complete Profile",
        description: "Fill in all profile information",
        progress: completed.length,
        target: PROFILE_FIELDS.length,
      });
      recommendations.push("Complete your profile to build trust with other users");
    }

    // Trust score
    if (user.trustScore !== undefined) {
      if (user.trustScore >= 800) {
        insights.push("You have an excellent trust score");
        achievements.push({
          title: "Trusted Member",
          description: "Achieved high trust score",
          earnedDate: now,
        });
      } else {
        insights.push(
          user.trustScore >= 600
            ? "You have a good trust score"
            : "Your trust score has room for improvement"
        );
        const target = user.trustScore >= 600 ? 800 : 600;
        goals.push({
          title: user.trustScore >= 600 ? "Trusted Member" : "Build Trust",
          description: `Reach trust score of ${target}`,
          progress: user.trustScore,
          target,
        });
        if (user.trustScore < 600) {
          recommendations.push("Complete verification steps to improve your trust score");
        }
      }
    }

    // Verification
    if (user.isVerified) {
      achievements.push({
        title: "Verified User",
        description: "Successfully completed account verification",
        earnedDate: now,
      });
    } else {
      recommendations.push("Complete account verification to access more features");
      goals.push({
        title: "Get Verified",
        description: "Complete account verification process",
        progress: 0,
        target: 1,
      });
    }

    // Role-specific
    if (user.role === "agent") {
      insights.push("As an agent, you have access to advanced property management tools");
      if (!user.isVerified) {
        recommendations.push("Agent verification is required to list properties");
      }
    }

    // Activity
    if (activityData && typeof activityData === "object") {
      try {
        const activityScore = this.calculateActivityScore(activityData as ActivityData);
        if (activityScore.level === "inactive") {
          recommendations.push("Stay active on the platform to get the best experience");
        } else if (activityScore.level === "highly_active") {
          achievements.push({
            title: "Power User",
            description: "Highly active platform user",
            earnedDate: new Date().toISOString(),
          });
        }
        recommendations.push(...activityScore.recommendations);
      } catch {
        // Silently skip malformed activity data
      }
    }

    return {
      insights: insights.slice(0, 5),
      recommendations: recommendations.slice(0, 5),
      achievements,
      goals,
    };
  }

  // ── Settings Update ──────────────────────────────────────────────────────────

  static validateSettingsUpdate(
    currentUser: User,
    updates: Partial<User>,
    requestingUserId: string
  ): { isValid: boolean; errors: string[]; allowedUpdates: Partial<User> } {
    const errors: string[] = [];
    const allowedUpdates: Partial<User> = {};

    // Permission check: only the user themselves or a higher-role manager may update
    if (
      String(currentUser.id) !== String(requestingUserId) &&
      !this.canManageUser({ id: requestingUserId, role: "admin", email: "", firstName: "", lastName: "", isVerified: true } as User, currentUser).canManage
    ) {
      return {
        isValid: false,
        errors: ["You do not have permission to update this user"],
        allowedUpdates: {},
      };
    }

    for (const [key, value] of Object.entries(updates)) {
      this.applyFieldUpdate(key, value, allowedUpdates, errors);
    }

    return { isValid: errors.length === 0, errors, allowedUpdates };
  }

  private static applyFieldUpdate(
    key: string,
    value: unknown,
    allowedUpdates: Partial<User>,
    errors: string[]
  ): void {
    switch (key) {
      case "firstName":
      case "lastName": {
        if (typeof value === "string" && value.length >= 2 && value.length <= 50) {
          (allowedUpdates as Record<string, unknown>)[key] = value;
        } else {
          errors.push(`${key} must be between 2 and 50 characters`);
        }
        break;
      }
      case "email": {
        if (typeof value === "string" && isValidEmail(value)) {
          allowedUpdates.email = value;
        } else {
          errors.push("Invalid email format");
        }
        break;
      }
      case "phone": {
        if (!value) {
          delete (allowedUpdates as Record<string, unknown>).phone;
        } else if (typeof value === "string" && isValidPhone(value)) {
          allowedUpdates.phone = value;
        } else {
          errors.push("Invalid phone number format");
        }
        break;
      }
      case "avatar": {
        if (!value) {
          delete (allowedUpdates as Record<string, unknown>).avatar;
        } else if (typeof value === "string" && isValidUrl(value)) {
          allowedUpdates.avatar = value;
        } else {
          errors.push("Invalid avatar URL");
        }
        break;
      }
      case "preferences": {
        try {
          allowedUpdates.preferences = this.validateUserPreferences(value);
        } catch (err) {
          errors.push(`Invalid preferences: ${err}`);
        }
        break;
      }
      case "role":
        errors.push("Role changes are not allowed through this method");
        break;
      default:
        errors.push(`Field '${key}' cannot be updated`);
    }
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

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
    recentActivity: RecentActivityItem[];
    quickActions: QuickAction[];
    notifications: Notification[];
  } {
    const agentActions: QuickAction[] = [
      { title: "List Property", description: "Add a new property listing", actionUrl: "/property/list", icon: "home" },
      { title: "View Analytics", description: "Check your performance metrics", actionUrl: "/analytics", icon: "chart" },
    ];

    const userActions: QuickAction[] = [
      { title: "Search Properties", description: "Find your perfect property", actionUrl: "/search", icon: "search" },
      { title: "Saved Properties", description: "View your saved properties", actionUrl: "/saved", icon: "heart" },
    ];

    const commonActions: QuickAction[] = [
      { title: "Messages", description: "Check your messages", actionUrl: "/inbox", icon: "message" },
      { title: "Profile", description: "Update your profile", actionUrl: "/profile", icon: "user" },
    ];

    const notifications: Notification[] = [];

    if (!user.isVerified) {
      notifications.push({
        type: "warning",
        title: "Verification Pending",
        message: "Complete your verification to access all features",
        actionUrl: "/verification",
      });
    }

    if (user.trustScore !== undefined && user.trustScore < 500) {
      notifications.push({
        type: "info",
        title: "Improve Trust Score",
        message: "Complete verification steps to increase your trust score",
        actionUrl: "/trust",
      });
    }

    return {
      summary: {
        totalProperties: 0,   // Provided by property service
        activeListings: 0,    // Provided by property service
        totalMessages: 0,     // Provided by messaging service
        unreadMessages: 0,    // Provided by messaging service
        trustScore: user.trustScore ?? 0,
        verificationStatus: user.isVerified ? "verified" : "pending",
      },
      recentActivity: recentActivity.filter(isRecentActivityItem).slice(0, 10),
      quickActions: [
        ...(user.role === "agent" ? agentActions : userActions),
        ...commonActions,
      ],
      notifications,
    };
  }
}