/**
 * Security Configuration for Chosen Threads
 * Contains all security-related settings and policies
 */

export const SECURITY_CONFIG = {
  // File upload security
  FILE_UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
    MAX_IMAGE_DIMENSIONS: {
      WIDTH: 4096,
      HEIGHT: 4096
    },
    MIN_IMAGE_DIMENSIONS: {
      WIDTH: 50,
      HEIGHT: 50
    }
  },

  // Input validation limits
  INPUT_LIMITS: {
    MAX_TEXT_LENGTH: 1000,
    MAX_EMAIL_LENGTH: 254,
    MAX_NAME_LENGTH: 50,
    MAX_PHONE_LENGTH: 20,
    MAX_ADDRESS_LENGTH: 100,
    MAX_NOTES_LENGTH: 500,
    MAX_URL_LENGTH: 500
  },

  // Password requirements
  PASSWORD_POLICY: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    SPECIAL_CHARS: '@$!%*?&'
  },

  // Session security
  SESSION: {
    TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
    SECURE_COOKIES: true,
    SAME_SITE: 'strict' as const,
    HTTP_ONLY: true
  },

  // Rate limiting
  RATE_LIMITING: {
    LOGIN_ATTEMPTS: 5,
    LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
    UPLOAD_ATTEMPTS: 10,
    UPLOAD_WINDOW: 60 * 1000, // 1 minute
    GENERAL_REQUESTS: 100,
    GENERAL_WINDOW: 60 * 1000 // 1 minute
  },

  // Content Security Policy
  CSP: {
    DIRECTIVES: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'", 
        "'unsafe-eval'", 
        "'unsafe-inline'",
        "https://js.stripe.com",
        "https://checkout.stripe.com"
      ],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'font-src': ["'self'", "data:"],
      'connect-src': ["'self'", "https://*.supabase.co"],
      'frame-src': ["'self'", "https://js.stripe.com", "https://checkout.stripe.com", "https://*.supabase.co"]
    }
  },

  // Admin security
  ADMIN: {
    SESSION_TIMEOUT: 4 * 60 * 60 * 1000, // 4 hours
    REQUIRE_2FA: false, // Future enhancement
    AUDIT_LOG_RETENTION: 90, // days
    MAX_LOGIN_ATTEMPTS: 3,
    LOCKOUT_DURATION: 30 * 60 * 1000 // 30 minutes
  },

  // Database security
  DATABASE: {
    ROW_LEVEL_SECURITY_ENABLED: true,
    AUDIT_ENABLED: true,
    BACKUP_RETENTION: 30, // days
    CONNECTION_TIMEOUT: 10000, // milliseconds
    MAX_CONNECTIONS: 100
  },

  // API security
  API: {
    RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
    RATE_LIMIT_MAX: 1000, // requests per window
    REQUEST_TIMEOUT: 30000, // 30 seconds
    MAX_PAYLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    REQUIRE_AUTH: true,
    CORS_ORIGINS: [
      'http://localhost:3000',
      'https://chosenthreads.com'
    ]
  },

  // Monitoring and logging
  MONITORING: {
    LOG_LEVEL: 'info',
    AUDIT_LOG_EVENTS: [
      'LOGIN_SUCCESS',
      'LOGIN_FAILURE',
      'LOGOUT',
      'ADMIN_ACCESS',
      'FILE_UPLOAD',
      'FILE_DELETE',
      'DATA_MODIFICATION',
      'SECURITY_VIOLATION'
    ],
    SECURITY_ALERT_EMAILS: [
      'security@chosenthreads.com'
    ],
    FAILED_ATTEMPT_THRESHOLD: 10
  }
};

// Validation functions
export const SecurityValidator = {
  /**
   * Validates that a file meets security requirements
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds limit of ${SECURITY_CONFIG.FILE_UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check MIME type
    if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not allowed'
      };
    }

    // Check extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: 'File extension not allowed'
      };
    }

    return { isValid: true };
  },

  /**
   * Validates password strength
   */
  validatePassword(password: string): { isValid: boolean; error?: string } {
    const config = SECURITY_CONFIG.PASSWORD_POLICY;

    if (password.length < config.MIN_LENGTH) {
      return {
        isValid: false,
        error: `Password must be at least ${config.MIN_LENGTH} characters long`
      };
    }

    if (password.length > config.MAX_LENGTH) {
      return {
        isValid: false,
        error: `Password must be less than ${config.MAX_LENGTH} characters long`
      };
    }

    if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one uppercase letter'
      };
    }

    if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one lowercase letter'
      };
    }

    if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one number'
      };
    }

    if (config.REQUIRE_SPECIAL_CHARS) {
      const specialCharsRegex = new RegExp(`[${config.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
      if (!specialCharsRegex.test(password)) {
        return {
          isValid: false,
          error: `Password must contain at least one special character (${config.SPECIAL_CHARS})`
        };
      }
    }

    return { isValid: true };
  },

  /**
   * Checks if an IP address should be rate limited
   */
  isRateLimited(ip: string, attempts: number, window: number): boolean {
    return attempts >= SECURITY_CONFIG.RATE_LIMITING.LOGIN_ATTEMPTS && 
           window < SECURITY_CONFIG.RATE_LIMITING.LOGIN_WINDOW;
  }
};

// CSP Header Generator
export class CSPGenerator {
  static generate(): string {
    const directives = SECURITY_CONFIG.CSP.DIRECTIVES;
    const cspParts = Object.entries(directives).map(([directive, sources]) => {
      return `${directive} ${sources.join(' ')}`;
    });
    return cspParts.join('; ');
  }

  static generateNonce(): string {
    return btoa(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }
}

export default SECURITY_CONFIG;