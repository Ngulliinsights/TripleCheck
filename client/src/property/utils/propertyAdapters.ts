import { Property, LocationData, ResidentialProperty, CommercialProperty, LandProperty, PropertyAdapter } from '@shared/types/property'

// ─── Value coercion helpers ────────────────────────────────────────────────────

function normalizeLocation(location: string | LocationData): LocationData {
  if (typeof location === 'object' && location !== null && 'address' in location) {
    return location as LocationData;
  }
  return {
    address: typeof location === 'string' ? location : 'Unknown Address',
    state: 'Unknown',
    country: 'Kenya',
  };
}

function normalizePrice(price: string | number): number {
  if (typeof price === 'number') return price;
  const parsed = parseFloat(price.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

function normalizeImages(property: Property): string[] {
  return property.images ?? (property as any).imageUrls ?? [];
}

function normalizeVerificationStatus(
  status: unknown
): 'verified' | 'pending' | 'unverified' | 'flagged' {
  switch (status) {
    case 'verified':
    case 'pending':
    case 'unverified':
    case 'flagged':
      return status;
    case 'draft':
      return 'pending';
    default:
      return 'pending';
  }
}

// ─── Optional-field extraction helpers ────────────────────────────────────────
// Returns undefined when the value should be omitted entirely (null / undefined / '').
// Never assigns undefined to a property — safe with exactOptionalPropertyTypes.

function toNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

function toBoolean(value: unknown): boolean | undefined {
  return value == null ? undefined : Boolean(value);
}

function toString(value: unknown): string | undefined {
  return value == null || value === '' ? undefined : String(value);
}

/**
 * Returns a shallow copy of `obj` with all undefined / null / '' values removed.
 * Omitting a key entirely is the only correctway to handle optional properties
 * under exactOptionalPropertyTypes — setting them to `undefined` is a type error.
 */
function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Partial<T>;
}

/**
 * Pulls through any feature keys not in `handledKeys`, stripping nullish values.
 * Keeps adapters open to arbitrary extra data without repeating the filter logic.
 */
function passAdditionalFeatures(
  features: Record<string, unknown> | undefined,
  handledKeys: ReadonlySet<string>
): Record<string, unknown> {
  if (!features) return {};
  return pickDefined(
    Object.fromEntries(Object.entries(features).filter(([k]) => !handledKeys.has(k)))
  );
}

// ─── Category detection ────────────────────────────────────────────────────────

function determineCategory(property: Property): 'residential' | 'commercial' | 'land' {
  const type = (property.type ?? (property as any).propertyType ?? '').toLowerCase();
  const title = property.title.toLowerCase();
  const description = property.description.toLowerCase();

  if (
    type.includes('land') ||
    title.includes('land') ||
    title.includes('acre') ||
    title.includes('plot') ||
    description.includes('land')
  ) {
    return 'land';
  }

  const commercialKeywords = ['office', 'retail', 'warehouse', 'industrial', 'commercial', 'shop', 'store'];
  if (
    commercialKeywords.some(kw => type.includes(kw)) ||
    ['office', 'commercial', 'retail', 'business'].some(kw => title.includes(kw))
  ) {
    return 'commercial';
  }

  return 'residential';
}

// ─── Base adapter ──────────────────────────────────────────────────────────────

export const basePropertyAdapter: PropertyAdapter<Property> = (property: Property): Property => {
  const required: any = {
    id: String(property.id),
    title: property.title,
    description: property.description,
    price: normalizePrice(property.price),
    location: normalizeLocation(property.location),
    images: normalizeImages(property),
    verified: property.verified ?? (property as any).verificationStatus === 'verified',
    type: property.type ?? (property as any).propertyType ?? 'unknown',
    category: determineCategory(property),
    features: property.features ?? {},
    createdAt: property.createdAt
      ? new Date(property.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: property.updatedAt
      ? new Date(property.updatedAt).toISOString()
      : new Date().toISOString(),
    status: (property.status as Property['status']) ?? 'available',
    rating: (property as any).aiVerification?.overallScore ?? 0,
    verificationStatus: normalizeVerificationStatus(property.verificationStatus),
  };

  const optionals = pickDefined({
    views: toNumber(property.viewCount),
    trustScore: toNumber(property.trustScore),
    coordinates: property.coordinates ?? undefined,
    owner: property.owner
      ? {
          id: property.owner.id,
          name:
            `${property.owner.firstName ?? ''} ${property.owner.lastName ?? ''}`.trim() ||
            (property.owner as any).username || property.owner.email,
          firstName: property.owner.firstName,
          lastName: property.owner.lastName,
          email: property.owner.email,
          trustScore: property.owner.trustScore,
          isVerifiedAgent: property.owner.isVerifiedAgent,
        }
      : undefined,
  });

  return { ...required, ...optionals };
};

// ─── Residential adapter ───────────────────────────────────────────────────────

const RESIDENTIAL_HANDLED = new Set([
  'bedrooms', 'bathrooms', 'squareFeet', 'amenities', 'furnished', 'petFriendly',
  'parkingSpaces', 'yearBuilt', 'balcony', 'garden',
]);

export const residentialPropertyAdapter: PropertyAdapter<Property> = (property: Property): ResidentialProperty => {
  const base = basePropertyAdapter(property);
  const f = property.features ?? {};

  const coreFeatures: ResidentialProperty['features'] = {
    bedrooms: Number((property as any).bedrooms ?? (f as any).bedrooms) || 0,
    bathrooms: Number((property as any).bathrooms ?? (f as any).bathrooms) || 0,
    squareFeet: Number((property as any).size ?? (f as any).squareFeet) || 0,
    amenities: (property as any).amenities ?? (f as any).amenities ?? [],
    furnished: Boolean((f as any).furnished),
    petFriendly: Boolean((f as any).petFriendly),
  };

  return {
    ...base,
    category: 'residential',
    type: (property.type as ResidentialProperty['type']) ?? 'apartment',
    features: {
      ...coreFeatures,
      ...pickDefined({
        parkingSpaces: toNumber((f as any).parkingSpaces),
        yearBuilt: toNumber((f as any).yearBuilt),
        balcony: toBoolean((f as any).balcony),
        garden: toBoolean((f as any).garden),
      }),
      ...passAdditionalFeatures(f as any, RESIDENTIAL_HANDLED),
    },
  };
};

// ─── Commercial adapter ────────────────────────────────────────────────────────

const COMMERCIAL_HANDLED = new Set([
  'size', 'yearBuilt', 'occupancyRate', 'roi', 'parkingSpaces',
  'floors', 'elevators', 'airConditioning', 'security', 'loadingDock',
]);

export const commercialPropertyAdapter: PropertyAdapter<Property> = (property: Property): CommercialProperty => {
  const base = basePropertyAdapter(property);
  const f = property.features ?? {};

  const coreFeatures: CommercialProperty['features'] = {
    squareFeet: Number((property as any).size ?? (property as any).area ?? (f as any).squareFeet) || 0,
    yearBuilt: Number((f as any).yearBuilt) || new Date().getFullYear(),
  };

  return {
    ...base,
    category: 'commercial',
    type: (property.type as CommercialProperty['type']) ?? 'office',
    features: {
      ...coreFeatures,
      ...pickDefined({
        occupancyRate: toNumber((f as any).occupancyRate),
        roi: toNumber((f as any).roi),
        parkingSpaces: toNumber((f as any).parkingSpaces),
        floors: toNumber((f as any).floors),
        elevators: toNumber((f as any).elevators),
        airConditioning: toBoolean((f as any).airConditioning),
        security: toBoolean((f as any).security),
        loadingDock: toBoolean((f as any).loadingDock),
      }),
      ...passAdditionalFeatures(f as any, COMMERCIAL_HANDLED),
    },
  };
};

// ─── Land adapter ──────────────────────────────────────────────────────────────

const LAND_HANDLED = new Set([
  'size', 'titleDeedStatus', 'soilType', 'zoning', 'developmentPotential',
  'topography', 'drainage', 'waterAccess', 'roadAccess', 'electricityAccess',
]);

function resolveLandType(property: Property): LandProperty['type'] {
  const zoning = typeof (property.features as any)?.zoning === 'string'
    ? (property.features as any).zoning.toLowerCase()
    : undefined;

  switch (zoning) {
    case 'commercial': return 'commercial';
    case 'industrial': return 'industrial';
    case 'agricultural':
    case 'farming': return 'agricultural';
  }

  const propType = property.type?.toLowerCase();
  if (propType === 'commercial' || propType === 'industrial' || propType === 'agricultural') {
    return propType as LandProperty['type'];
  }

  return 'residential';
}

export const landPropertyAdapter: PropertyAdapter<Property> = (property: Property): LandProperty => {
  const base = basePropertyAdapter(property);
  const f = property.features ?? {};

  const coreFeatures: LandProperty['features'] = {
    sizeValue: Number((property as any).size ?? (property as any).area ?? (f as any).sizeValue ?? 0),
    sizeUnit: ((f as any).sizeUnit as any) ?? 'sqm',
    titleDeedStatus:
      ((f as any).titleDeedStatus as LandProperty['features']['titleDeedStatus']) ?? 'available',
  };

  return {
    ...base,
    category: 'land',
    type: resolveLandType(property),
    features: {
      ...coreFeatures,
      ...pickDefined({
        soilType: toString((f as any).soilType),
        zoning: toString((f as any).zoning),
        developmentPotential: toString((f as any).developmentPotential),
        topography: toString((f as any).topography),
        drainage: toString((f as any).drainage),
        waterAccess: toBoolean((f as any).waterAccess),
        roadAccess: toBoolean((f as any).roadAccess),
        electricityAccess: toBoolean((f as any).electricityAccess),
      }),
      ...passAdditionalFeatures(f as any, LAND_HANDLED),
    },
  };
};

// ─── Adaptive & batch adapters ─────────────────────────────────────────────────

export const adaptivePropertyAdapter: PropertyAdapter<Property> = (property: Property): Property => {
  const category = determineCategory(property);
  switch (category) {
    case 'residential': return residentialPropertyAdapter(property);
    case 'commercial':  return commercialPropertyAdapter(property);
    case 'land':        return landPropertyAdapter(property);
    default:            return basePropertyAdapter(property);
  }
};

export function adaptProperties<T>(
  properties: Property[],
  adapter: PropertyAdapter<Property> = adaptivePropertyAdapter
): T[] {
  return properties
    .filter((p): p is Property => p != null && typeof p === 'object')
    .map(adapter) as T[];
}

// ─── Type guards ───────────────────────────────────────────────────────────────

export function isResidentialProperty(property: Property): property is ResidentialProperty {
  return (
    property.category === 'residential' &&
    typeof property.features.bedrooms === 'number' &&
    typeof property.features.bathrooms === 'number'
  );
}

export function isCommercialProperty(property: Property): property is CommercialProperty {
  return (
    property.category === 'commercial' &&
    typeof property.features.squareFeet === 'number' &&
    typeof property.features.yearBuilt === 'number'
  );
}

export function isLandProperty(property: Property): property is LandProperty {
  return property.category === 'land' && typeof property.features.sizeValue === 'number';
}

// ─── Runtime validation ────────────────────────────────────────────────────────

const VALID_VERIFICATION_STATUSES = new Set(['verified', 'pending', 'unverified', 'flagged']);
const VALID_CATEGORIES = new Set(['residential', 'commercial', 'land']);

export function validateNormalizedProperty(property: unknown): property is Property {
  if (typeof property !== 'object' || property === null) return false;

  const p = property as Record<string, unknown>;

  if (
    typeof p.id !== 'string' ||
    typeof p.title !== 'string' ||
    typeof p.description !== 'string' ||
    typeof p.price !== 'number' ||
    typeof p.location !== 'string' ||
    !Array.isArray(p.images) ||
    typeof p.verified !== 'boolean' ||
    typeof p.type !== 'string' ||
    !VALID_CATEGORIES.has(p.category as string) ||
    typeof p.features !== 'object' || p.features === null ||
    typeof p.createdAt !== 'string'
  ) {
    return false;
  }

  if (!(p.images as unknown[]).every(img => typeof img === 'string')) return false;

  if (
    p.verificationStatus != null &&
    !VALID_VERIFICATION_STATUSES.has(p.verificationStatus as string)
  ) {
    return false;
  }

  try {
    new Date(p.createdAt as string);
    if (p.updatedAt != null) new Date(p.updatedAt as string);
  } catch {
    return false;
  }

  return true;
}