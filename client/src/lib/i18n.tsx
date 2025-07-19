/**
 * Internationalization (i18n) Support
 * 
 * Supports English and Swahili for the Kenyan market
 */

export type Language = 'en' | 'sw';

interface TranslationKeys {
  // Navigation
  'nav.home': string;
  'nav.services': string;
  'nav.about': string;
  'nav.contact': string;
  'nav.reviews': string;
  'nav.gallery': string;
  'nav.booking': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.cancel': string;
  'common.save': string;
  'common.edit': string;
  'common.delete': string;
  'common.confirm': string;
  'common.back': string;
  'common.next': string;
  'common.previous': string;
  'common.submit': string;
  'common.search': string;
  'common.filter': string;
  'common.sort': string;
  'common.view': string;
  'common.download': string;
  'common.upload': string;
  'common.share': string;
  'common.copy': string;
  'common.print': string;
  'common.close': string;
  'common.open': string;
  'common.select': string;
  'common.clear': string;
  'common.reset': string;
  'common.refresh': string;
  'common.update': string;
  'common.create': string;
  'common.add': string;
  'common.remove': string;
  'common.yes': string;
  'common.no': string;
  'common.ok': string;
  'common.done': string;
  'common.pending': string;
  'common.approved': string;
  'common.rejected': string;
  'common.active': string;
  'common.inactive': string;
  'common.available': string;
  'common.unavailable': string;
  'common.online': string;
  'common.offline': string;
  'common.public': string;
  'common.private': string;
  'common.draft': string;
  'common.published': string;
  'common.archived': string;

  // Home Page
  'home.hero.title': string;
  'home.hero.subtitle': string;
  'home.hero.cta': string;
  'home.features.title': string;
  'home.testimonials.title': string;
  'home.contact.title': string;

  // Services
  'services.title': string;
  'services.description': string;
  'services.book': string;
  'services.price': string;
  'services.duration': string;
  'services.category': string;
  'services.popular': string;
  'services.new': string;
  'services.featured': string;

  // Booking
  'booking.title': string;
  'booking.selectService': string;
  'booking.selectDate': string;
  'booking.selectTime': string;
  'booking.customerInfo': string;
  'booking.confirm': string;
  'booking.success': string;
  'booking.error': string;
  'booking.name': string;
  'booking.email': string;
  'booking.phone': string;
  'booking.notes': string;
  'booking.total': string;
  'booking.payment': string;
  'booking.paymentMethod': string;
  'booking.cardNumber': string;
  'booking.expiryDate': string;
  'booking.cvv': string;
  'booking.billingAddress': string;

  // Reviews
  'reviews.title': string;
  'reviews.write': string;
  'reviews.rating': string;
  'reviews.comment': string;
  'reviews.submit': string;
  'reviews.helpful': string;
  'reviews.report': string;
  'reviews.verified': string;
  'reviews.anonymous': string;

  // Gallery
  'gallery.title': string;
  'gallery.category': string;
  'gallery.viewAll': string;
  'gallery.before': string;
  'gallery.after': string;

  // Contact
  'contact.title': string;
  'contact.address': string;
  'contact.phone': string;
  'contact.email': string;
  'contact.hours': string;
  'contact.message': string;
  'contact.send': string;
  'contact.location': string;
  'contact.directions': string;

  // About
  'about.title': string;
  'about.story': string;
  'about.mission': string;
  'about.team': string;
  'about.experience': string;
  'about.certifications': string;

  // Forms
  'form.required': string;
  'form.invalid': string;
  'form.tooShort': string;
  'form.tooLong': string;
  'form.invalidEmail': string;
  'form.invalidPhone': string;
  'form.passwordMismatch': string;
  'form.weakPassword': string;

  // Errors
  'error.notFound': string;
  'error.serverError': string;
  'error.networkError': string;
  'error.unauthorized': string;
  'error.forbidden': string;
  'error.timeout': string;
  'error.generic': string;

  // Success Messages
  'success.saved': string;
  'success.updated': string;
  'success.deleted': string;
  'success.created': string;
  'success.sent': string;
  'success.booked': string;
  'success.cancelled': string;

  // Time and Date
  'time.morning': string;
  'time.afternoon': string;
  'time.evening': string;
  'time.today': string;
  'time.tomorrow': string;
  'time.yesterday': string;
  'time.thisWeek': string;
  'time.nextWeek': string;
  'time.thisMonth': string;
  'time.nextMonth': string;

  // Currency
  'currency.kes': string;
  'currency.usd': string;
  'currency.free': string;
}

const translations: Record<Language, TranslationKeys> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.reviews': 'Reviews',
    'nav.gallery': 'Gallery',
    'nav.booking': 'Book Now',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.view': 'View',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.share': 'Share',
    'common.copy': 'Copy',
    'common.print': 'Print',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.select': 'Select',
    'common.clear': 'Clear',
    'common.reset': 'Reset',
    'common.refresh': 'Refresh',
    'common.update': 'Update',
    'common.create': 'Create',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.done': 'Done',
    'common.pending': 'Pending',
    'common.approved': 'Approved',
    'common.rejected': 'Rejected',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.available': 'Available',
    'common.unavailable': 'Unavailable',
    'common.online': 'Online',
    'common.offline': 'Offline',
    'common.public': 'Public',
    'common.private': 'Private',
    'common.draft': 'Draft',
    'common.published': 'Published',
    'common.archived': 'Archived',

    // Home Page
    'home.hero.title': 'Professional Beauty Services in Kenya',
    'home.hero.subtitle': 'Transform your look with our expert beauty treatments',
    'home.hero.cta': 'Book Your Appointment',
    'home.features.title': 'Why Choose Us',
    'home.testimonials.title': 'What Our Clients Say',
    'home.contact.title': 'Get In Touch',

    // Services
    'services.title': 'Our Services',
    'services.description': 'Professional beauty treatments tailored for you',
    'services.book': 'Book Service',
    'services.price': 'Price',
    'services.duration': 'Duration',
    'services.category': 'Category',
    'services.popular': 'Popular',
    'services.new': 'New',
    'services.featured': 'Featured',

    // Booking
    'booking.title': 'Book Your Appointment',
    'booking.selectService': 'Select Service',
    'booking.selectDate': 'Select Date',
    'booking.selectTime': 'Select Time',
    'booking.customerInfo': 'Your Information',
    'booking.confirm': 'Confirm Booking',
    'booking.success': 'Booking Confirmed!',
    'booking.error': 'Booking Failed',
    'booking.name': 'Full Name',
    'booking.email': 'Email Address',
    'booking.phone': 'Phone Number',
    'booking.notes': 'Special Requests',
    'booking.total': 'Total Amount',
    'booking.payment': 'Payment',
    'booking.paymentMethod': 'Payment Method',
    'booking.cardNumber': 'Card Number',
    'booking.expiryDate': 'Expiry Date',
    'booking.cvv': 'CVV',
    'booking.billingAddress': 'Billing Address',

    // Reviews
    'reviews.title': 'Customer Reviews',
    'reviews.write': 'Write a Review',
    'reviews.rating': 'Rating',
    'reviews.comment': 'Your Review',
    'reviews.submit': 'Submit Review',
    'reviews.helpful': 'Helpful',
    'reviews.report': 'Report',
    'reviews.verified': 'Verified Customer',
    'reviews.anonymous': 'Anonymous',

    // Gallery
    'gallery.title': 'Our Work',
    'gallery.category': 'Category',
    'gallery.viewAll': 'View All',
    'gallery.before': 'Before',
    'gallery.after': 'After',

    // Contact
    'contact.title': 'Contact Us',
    'contact.address': 'Address',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.hours': 'Business Hours',
    'contact.message': 'Message',
    'contact.send': 'Send Message',
    'contact.location': 'Location',
    'contact.directions': 'Get Directions',

    // About
    'about.title': 'About Us',
    'about.story': 'Our Story',
    'about.mission': 'Our Mission',
    'about.team': 'Our Team',
    'about.experience': 'Years of Experience',
    'about.certifications': 'Certifications',

    // Forms
    'form.required': 'This field is required',
    'form.invalid': 'Invalid input',
    'form.tooShort': 'Too short',
    'form.tooLong': 'Too long',
    'form.invalidEmail': 'Invalid email address',
    'form.invalidPhone': 'Invalid phone number',
    'form.passwordMismatch': 'Passwords do not match',
    'form.weakPassword': 'Password is too weak',

    // Errors
    'error.notFound': 'Page not found',
    'error.serverError': 'Server error occurred',
    'error.networkError': 'Network connection error',
    'error.unauthorized': 'Access denied',
    'error.forbidden': 'Permission denied',
    'error.timeout': 'Request timeout',
    'error.generic': 'Something went wrong',

    // Success Messages
    'success.saved': 'Successfully saved',
    'success.updated': 'Successfully updated',
    'success.deleted': 'Successfully deleted',
    'success.created': 'Successfully created',
    'success.sent': 'Successfully sent',
    'success.booked': 'Successfully booked',
    'success.cancelled': 'Successfully cancelled',

    // Time and Date
    'time.morning': 'Morning',
    'time.afternoon': 'Afternoon',
    'time.evening': 'Evening',
    'time.today': 'Today',
    'time.tomorrow': 'Tomorrow',
    'time.yesterday': 'Yesterday',
    'time.thisWeek': 'This Week',
    'time.nextWeek': 'Next Week',
    'time.thisMonth': 'This Month',
    'time.nextMonth': 'Next Month',

    // Currency
    'currency.kes': 'KES',
    'currency.usd': 'USD',
    'currency.free': 'Free',
  },

  sw: {
    // Navigation
    'nav.home': 'Nyumbani',
    'nav.services': 'Huduma',
    'nav.about': 'Kuhusu',
    'nav.contact': 'Mawasiliano',
    'nav.reviews': 'Maoni',
    'nav.gallery': 'Picha',
    'nav.booking': 'Weka Miadi',

    // Common
    'common.loading': 'Inapakia...',
    'common.error': 'Hitilafu',
    'common.success': 'Mafanikio',
    'common.cancel': 'Ghairi',
    'common.save': 'Hifadhi',
    'common.edit': 'Hariri',
    'common.delete': 'Futa',
    'common.confirm': 'Thibitisha',
    'common.back': 'Rudi',
    'common.next': 'Ifuatayo',
    'common.previous': 'Iliyotangulia',
    'common.submit': 'Wasilisha',
    'common.search': 'Tafuta',
    'common.filter': 'Chuja',
    'common.sort': 'Panga',
    'common.view': 'Ona',
    'common.download': 'Pakua',
    'common.upload': 'Pakia',
    'common.share': 'Shiriki',
    'common.copy': 'Nakili',
    'common.print': 'Chapisha',
    'common.close': 'Funga',
    'common.open': 'Fungua',
    'common.select': 'Chagua',
    'common.clear': 'Futa',
    'common.reset': 'Weka upya',
    'common.refresh': 'Onyesha upya',
    'common.update': 'Sasisha',
    'common.create': 'Unda',
    'common.add': 'Ongeza',
    'common.remove': 'Ondoa',
    'common.yes': 'Ndiyo',
    'common.no': 'Hapana',
    'common.ok': 'Sawa',
    'common.done': 'Imekamilika',
    'common.pending': 'Inasubiri',
    'common.approved': 'Imeidhinishwa',
    'common.rejected': 'Imekataliwa',
    'common.active': 'Hai',
    'common.inactive': 'Haifanyi kazi',
    'common.available': 'Inapatikana',
    'common.unavailable': 'Haipatikani',
    'common.online': 'Mtandaoni',
    'common.offline': 'Nje ya mtandao',
    'common.public': 'Umma',
    'common.private': 'Binafsi',
    'common.draft': 'Rasimu',
    'common.published': 'Imechapishwa',
    'common.archived': 'Imehifadhiwa',

    // Home Page
    'home.hero.title': 'Huduma za Urembo wa Kitaalamu Kenya',
    'home.hero.subtitle': 'Badilisha mwonekano wako na matibabu yetu ya kitaalamu',
    'home.hero.cta': 'Weka Miadi Yako',
    'home.features.title': 'Kwa Nini Utuchague',
    'home.testimonials.title': 'Wateja Wetu Wanasema Nini',
    'home.contact.title': 'Wasiliana Nasi',

    // Services
    'services.title': 'Huduma Zetu',
    'services.description': 'Matibabu ya urembo ya kitaalamu yaliyoundwa kwa ajili yako',
    'services.book': 'Weka Huduma',
    'services.price': 'Bei',
    'services.duration': 'Muda',
    'services.category': 'Jamii',
    'services.popular': 'Maarufu',
    'services.new': 'Mpya',
    'services.featured': 'Iliyoangaziwa',

    // Booking
    'booking.title': 'Weka Miadi Yako',
    'booking.selectService': 'Chagua Huduma',
    'booking.selectDate': 'Chagua Tarehe',
    'booking.selectTime': 'Chagua Wakati',
    'booking.customerInfo': 'Maelezo Yako',
    'booking.confirm': 'Thibitisha Miadi',
    'booking.success': 'Miadi Imethibitishwa!',
    'booking.error': 'Miadi Imeshindwa',
    'booking.name': 'Jina Kamili',
    'booking.email': 'Anwani ya Barua Pepe',
    'booking.phone': 'Nambari ya Simu',
    'booking.notes': 'Maombi Maalum',
    'booking.total': 'Jumla',
    'booking.payment': 'Malipo',
    'booking.paymentMethod': 'Njia ya Malipo',
    'booking.cardNumber': 'Nambari ya Kadi',
    'booking.expiryDate': 'Tarehe ya Mwisho',
    'booking.cvv': 'CVV',
    'booking.billingAddress': 'Anwani ya Bili',

    // Reviews
    'reviews.title': 'Maoni ya Wateja',
    'reviews.write': 'Andika Maoni',
    'reviews.rating': 'Ukadiriaji',
    'reviews.comment': 'Maoni Yako',
    'reviews.submit': 'Wasilisha Maoni',
    'reviews.helpful': 'Yanafaa',
    'reviews.report': 'Ripoti',
    'reviews.verified': 'Mteja Aliyethibitishwa',
    'reviews.anonymous': 'Asiyejulikana',

    // Gallery
    'gallery.title': 'Kazi Yetu',
    'gallery.category': 'Jamii',
    'gallery.viewAll': 'Ona Zote',
    'gallery.before': 'Kabla',
    'gallery.after': 'Baada',

    // Contact
    'contact.title': 'Wasiliana Nasi',
    'contact.address': 'Anwani',
    'contact.phone': 'Simu',
    'contact.email': 'Barua Pepe',
    'contact.hours': 'Masaa ya Biashara',
    'contact.message': 'Ujumbe',
    'contact.send': 'Tuma Ujumbe',
    'contact.location': 'Mahali',
    'contact.directions': 'Pata Mwelekeo',

    // About
    'about.title': 'Kuhusu Sisi',
    'about.story': 'Hadithi Yetu',
    'about.mission': 'Dhamira Yetu',
    'about.team': 'Timu Yetu',
    'about.experience': 'Miaka ya Uzoefu',
    'about.certifications': 'Vyeti',

    // Forms
    'form.required': 'Sehemu hii inahitajika',
    'form.invalid': 'Uingizaji si sahihi',
    'form.tooShort': 'Ni fupi sana',
    'form.tooLong': 'Ni ndefu sana',
    'form.invalidEmail': 'Anwani ya barua pepe si sahihi',
    'form.invalidPhone': 'Nambari ya simu si sahihi',
    'form.passwordMismatch': 'Manenosiri hayalingani',
    'form.weakPassword': 'Neno la siri ni dhaifu sana',

    // Errors
    'error.notFound': 'Ukurasa haujapatikana',
    'error.serverError': 'Hitilafu ya seva imetokea',
    'error.networkError': 'Hitilafu ya muunganisho wa mtandao',
    'error.unauthorized': 'Ufikiaji umekataliwa',
    'error.forbidden': 'Ruhusa imekataliwa',
    'error.timeout': 'Ombi limechelewa',
    'error.generic': 'Kuna kitu kimekosea',

    // Success Messages
    'success.saved': 'Imehifadhiwa kwa mafanikio',
    'success.updated': 'Imesasishwa kwa mafanikio',
    'success.deleted': 'Imefutwa kwa mafanikio',
    'success.created': 'Imeundwa kwa mafanikio',
    'success.sent': 'Imetumwa kwa mafanikio',
    'success.booked': 'Imewekwa kwa mafanikio',
    'success.cancelled': 'Imeghairiwa kwa mafanikio',

    // Time and Date
    'time.morning': 'Asubuhi',
    'time.afternoon': 'Mchana',
    'time.evening': 'Jioni',
    'time.today': 'Leo',
    'time.tomorrow': 'Kesho',
    'time.yesterday': 'Jana',
    'time.thisWeek': 'Wiki Hii',
    'time.nextWeek': 'Wiki Ijayo',
    'time.thisMonth': 'Mwezi Huu',
    'time.nextMonth': 'Mwezi Ujao',

    // Currency
    'currency.kes': 'KES',
    'currency.usd': 'USD',
    'currency.free': 'Bure',
  },
};

// Language context and provider
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number, currency?: 'KES' | 'USD') => string;
  formatDate: (date: Date) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage, default to English
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language;
      return saved && (saved === 'en' || saved === 'sw') ? saved : 'en';
    }
    return 'en';
  });

  // Save language preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language]);

  // Translation function with parameter support
  const t = (key: keyof TranslationKeys, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations.en[key] || key;
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, String(value));
      });
    }
    
    return translation;
  };

  // Currency formatting for Kenyan market
  const formatCurrency = (amount: number, currency: 'KES' | 'USD' = 'KES'): string => {
    if (currency === 'KES') {
      return language === 'sw' 
        ? `KES ${amount.toLocaleString('sw-KE')}`
        : `KES ${amount.toLocaleString('en-KE')}`;
    } else {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
  };

  // Date formatting for Kenyan market
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return language === 'sw'
      ? date.toLocaleDateString('sw-KE', options)
      : date.toLocaleDateString('en-KE', options);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    formatCurrency,
    formatDate,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Language switcher component
export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('sw')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'sw'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        SW
      </button>
    </div>
  );
};

// Export types and utilities
export type { TranslationKeys };
export { translations };