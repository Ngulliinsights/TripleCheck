/**
 * Property Images Utility
 * Manages sample property images for the ListProperty component
 */

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  category: 'residential' | 'commercial';
}

// Commercial property images
export const COMMERCIAL_IMAGES: PropertyImage[] = [
  {
    id: 'comm-1',
    url: '/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg',
    alt: 'Modern commercial building exterior',
    category: 'commercial'
  },
  {
    id: 'comm-2',
    url: '/assets/Commercial/benjamin-cheng-wTZAqLPcTKk-unsplash (1).jpg',
    alt: 'Contemporary office building',
    category: 'commercial'
  },
  {
    id: 'comm-3',
    url: '/assets/Commercial/isai-sanchez-MLIUd81AX1o-unsplash.jpg',
    alt: 'Commercial complex with glass facade',
    category: 'commercial'
  },
  {
    id: 'comm-4',
    url: '/assets/Commercial/kc-shum-OKdd71f5Oq8-unsplash (1).jpg',
    alt: 'High-rise commercial building',
    category: 'commercial'
  },
  {
    id: 'comm-5',
    url: '/assets/Commercial/nikita-pishchugin-y2lZI81BGk0-unsplash.jpg',
    alt: 'Modern office tower',
    category: 'commercial'
  },
  {
    id: 'comm-6',
    url: '/assets/Commercial/nir-himi--i87qT8TJ34-unsplash.jpg',
    alt: 'Commercial building with unique architecture',
    category: 'commercial'
  },
  {
    id: 'comm-7',
    url: '/assets/Commercial/omar-elsharawy-lTqU2v0OKH4-unsplash.jpg',
    alt: 'Business district commercial property',
    category: 'commercial'
  },
  {
    id: 'comm-8',
    url: '/assets/Commercial/patrick-tomasso-gMes5dNykus-unsplash.jpg',
    alt: 'Corporate office building',
    category: 'commercial'
  },
  {
    id: 'comm-9',
    url: '/assets/Commercial/pawel-czerwinski-3-Q4hnx60WM-unsplash.jpg',
    alt: 'Modern commercial architecture',
    category: 'commercial'
  },
  {
    id: 'comm-10',
    url: '/assets/Commercial/roman-fxTYHz1RG10-unsplash.jpg',
    alt: 'Commercial building with modern design',
    category: 'commercial'
  },
  {
    id: 'comm-11',
    url: '/assets/Commercial/the-prototype-45-GefVF-TA-unsplash.jpg',
    alt: 'Contemporary commercial space',
    category: 'commercial'
  },
  {
    id: 'comm-12',
    url: '/assets/Commercial/uran-wang-xsZ47_FLdpo-unsplash.jpg',
    alt: 'Commercial property with glass exterior',
    category: 'commercial'
  },
  {
    id: 'comm-13',
    url: '/assets/Commercial/willian-justen-de-vasconcellos-DY6g9FgXwbY-unsplash.jpg',
    alt: 'Modern commercial building facade',
    category: 'commercial'
  },
  {
    id: 'comm-14',
    url: '/assets/Commercial/zhiqiang-wang-9anoZ1zUr40-unsplash.jpg',
    alt: 'Commercial office complex',
    category: 'commercial'
  }
];

// Residential property images
export const RESIDENTIAL_IMAGES: PropertyImage[] = [
  {
    id: 'res-1',
    url: '/assets/Residential/alejandra-cifre-gonzalez-ylyn5r4vxcA-unsplash.jpg',
    alt: 'Beautiful residential home exterior',
    category: 'residential'
  },
  {
    id: 'res-2',
    url: '/assets/Residential/alexander-andrews-A3DPhhAL6Zg-unsplash.jpg',
    alt: 'Modern residential property',
    category: 'residential'
  },
  {
    id: 'res-3',
    url: '/assets/Residential/billy-jo-catbagan-ysUyvjCocWo-unsplash.jpg',
    alt: 'Contemporary home design',
    category: 'residential'
  },
  {
    id: 'res-4',
    url: '/assets/Residential/caroline-badran-aaONSK4BKxc-unsplash.jpg',
    alt: 'Elegant residential architecture',
    category: 'residential'
  },
  {
    id: 'res-5',
    url: '/assets/Residential/caroline-badran-nf7iKpydFR4-unsplash.jpg',
    alt: 'Stylish home exterior',
    category: 'residential'
  },
  {
    id: 'res-6',
    url: '/assets/Residential/caroline-badran-OZIdKtn8pKs-unsplash.jpg',
    alt: 'Modern residential building',
    category: 'residential'
  },
  {
    id: 'res-7',
    url: '/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg',
    alt: 'Luxury residential property',
    category: 'residential'
  },
  {
    id: 'res-8',
    url: '/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg',
    alt: 'Beautiful home with garden',
    category: 'residential'
  },
  {
    id: 'res-9',
    url: '/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg',
    alt: 'Contemporary residential design',
    category: 'residential'
  },
  {
    id: 'res-10',
    url: '/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg',
    alt: 'Charming residential home',
    category: 'residential'
  },
  {
    id: 'res-11',
    url: '/assets/Residential/jason-briscoe-AQl-J19ocWE-unsplash.jpg',
    alt: 'Modern apartment building',
    category: 'residential'
  },
  {
    id: 'res-12',
    url: '/assets/Residential/joel-filipe-RFDP7_80v5A-unsplash.jpg',
    alt: 'Residential property with unique features',
    category: 'residential'
  },
  {
    id: 'res-13',
    url: '/assets/Residential/krzysztof-hepner-V7Q0Oh3Az-c-unsplash.jpg',
    alt: 'Elegant home architecture',
    category: 'residential'
  },
  {
    id: 'res-14',
    url: '/assets/Residential/luke-van-zyl-koH7IVuwRLw-unsplash.jpg',
    alt: 'Beautiful residential exterior',
    category: 'residential'
  },
  {
    id: 'res-15',
    url: '/assets/Residential/michael-oxendine-GHCVUtBECuY-unsplash (1).jpg',
    alt: 'Modern home design',
    category: 'residential'
  },
  {
    id: 'res-16',
    url: '/assets/Residential/rebecca-chandler-z6Yn9hhlrJw-unsplash.jpg',
    alt: 'Stylish residential property',
    category: 'residential'
  },
  {
    id: 'res-17',
    url: '/assets/Residential/sebastien-lavalaye-gNY6RsMIsPo-unsplash.jpg',
    alt: 'Contemporary residential building',
    category: 'residential'
  },
  {
    id: 'res-18',
    url: '/assets/Residential/terrah-holly-pmhdkgRCbtE-unsplash.jpg',
    alt: 'Beautiful home with landscaping',
    category: 'residential'
  },
  {
    id: 'res-19',
    url: '/assets/Residential/webaliser-_TPTXZd9mOo-unsplash.jpg',
    alt: 'Modern residential architecture',
    category: 'residential'
  }
];

// Combined images array
export const ALL_PROPERTY_IMAGES = [...COMMERCIAL_IMAGES, ...RESIDENTIAL_IMAGES];

/**
 * Get images based on property type
 */
export function getImagesByPropertyType(propertyType: string): PropertyImage[] {
  const isCommercial = propertyType === 'commercial';
  
  if (isCommercial) {
    return COMMERCIAL_IMAGES;
  }
  
  // For residential types (apartment, house, villa, townhouse, land)
  return RESIDENTIAL_IMAGES;
}

/**
 * Get random images for a property type
 */
export function getRandomImages(propertyType: string, count: number = 3): PropertyImage[] {
  const availableImages = getImagesByPropertyType(propertyType);
  const shuffled = [...availableImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get a single random image for a property type
 */
export function getRandomImage(propertyType: string): PropertyImage {
  const images = getImagesByPropertyType(propertyType);
  const randomImage = images[Math.floor(Math.random() * images.length)];
  return randomImage || images[0] || { id: 'default', url: '/images/default-property.jpg', alt: 'Default property image', category: 'residential' as const };
}

/**
 * Convert PropertyImage array to URL strings for API
 */
export function imagesToUrls(images: PropertyImage[]): string[] {
  return images.map(img => img.url);
}