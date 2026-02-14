/**
 * Security utilities for CSS and HTML content
 */

export class SecureCSS {
  /**
   * Sanitizes CSS property values to prevent CSS injection
   */
  static sanitizeCSSValue(value: string): string {
    if (typeof value !== 'string') return '';
    
    return value
      // Remove dangerous content
      .replace(/javascript:/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/@import/gi, '')
      .replace(/<script/gi, '')
      .replace(/<\/script>/gi, '')
      // Remove URL functions with dangerous protocols
      .replace(/url\s*\(\s*['"]?javascript:/gi, 'url(\'data:')
      .replace(/url\s*\(\s*['"]?data:(?!image\/)/gi, 'url(\'data:image/png')
      // Limit length
      .substring(0, 1000)
      .trim();
  }

  /**
   * Validates CSS property names
   */
  static isValidCSSProperty(property: string): boolean {
    const validProperties = [
      'color', 'background-color', 'border-color', 'outline-color',
      'background', 'background-image', 'border', 'outline',
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
      'text-align', 'text-decoration', 'text-transform', 'text-shadow',
      'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
      'opacity', 'visibility', 'overflow', 'float', 'clear',
      'transform', 'transition', 'animation', 'cursor', 'pointer-events'
    ];
    
    return validProperties.includes(property.toLowerCase());
  }

  /**
   * Creates safe CSS custom properties
   */
  static createSafeCSSVariable(name: string, value: string): string {
    // Sanitize variable name
    const sanitizedName = name
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 50);
    
    // Sanitize value
    const sanitizedValue = this.sanitizeCSSValue(value);
    
    return `--${sanitizedName}: ${sanitizedValue};`;
  }
}

/**
 * HTML sanitization utilities
 */
export class SecureHTML {
  /**
   * Escapes HTML content to prevent injection
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Validates HTML attribute values
   */
  static sanitizeAttributeValue(value: string): string {
    return value
      .replace(/[<>"'&]/g, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapeMap[match];
      })
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .substring(0, 500);
  }

  /**
   * Validates that content is safe for insertion into HTML
   */
  static isSafeForHTML(content: string): boolean {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<link/i,
      /<meta/i,
      /@import/i,
      /expression\s*\(/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(content));
  }
}

/**
 * Input validation utilities
 */
export class InputValidator {
  /**
   * Validates and sanitizes text input
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, maxLength)
      .trim();
  }

  /**
   * Validates email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validates phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validates names (letters, spaces, hyphens, apostrophes only)
   */
  static isValidName(name: string): boolean {
    const nameRegex = /^[a-zA-Z\s\-'\.]{2,50}$/;
    return nameRegex.test(name);
  }

  /**
   * Validates numeric input within range
   */
  static validateNumber(input: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): { isValid: boolean; value?: number } {
    const num = parseFloat(input);
    
    if (isNaN(num)) {
      return { isValid: false };
    }
    
    if (num < min || num > max) {
      return { isValid: false };
    }
    
    return { isValid: true, value: num };
  }

  /**
   * Validates URL format
   */
  static isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
}

/**
 * Content Security Policy helpers
 */
export class CSPHelper {
  /**
   * Generates nonce value for CSP
   */
static generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

  /**
   * Creates safe inline styles with nonce
   */
  static createSafeStyle(css: string, nonce?: string): { css: string; nonce?: string } {
    const sanitizedCSS = SecureCSS.sanitizeCSSValue(css);
    return {
      css: sanitizedCSS,
      nonce: nonce || this.generateNonce()
    };
  }
}