import DOMPurify from 'isomorphic-dompurify';

// Configuration for DOMPurify to allow safe SVG elements
const SVG_CONFIG = {
  ALLOWED_TAGS: [
    'svg', 'path', 'image', 'g', 'rect', 'circle', 'ellipse',
    'line', 'polyline', 'polygon', 'text', 'tspan', 'defs',
    'linearGradient', 'radialGradient', 'stop', 'clipPath',
    'mask', 'pattern', 'use', 'symbol', 'marker', 'view'
  ],
  ALLOWED_ATTR: [
    'viewBox', 'xmlns', 'width', 'height', 'style', 'class', 'id',
    'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
    'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity',
    'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height',
    'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'href',
    'preserveAspectRatio', 'clip-path', 'mask', 'filter',
    'font-family', 'font-size', 'font-weight', 'text-anchor',
    'dx', 'dy', 'rotate', 'scale', 'translate', 'skewX', 'skewY'
  ],
  ALLOWED_URI_REGEXP: /^(?:https?|ftp|mailto|tel|callto|cid|xmpp|data|blob):/
};

export class SecureSVGRenderer {
  /**
   * Sanitizes SVG content to prevent XSS
   */
  static sanitizeSVG(svgContent: string): string {
    if (!svgContent || typeof svgContent !== 'string') {
      return '';
    }
    
    const preSanitized = svgContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, 'data: ');
    
    return DOMPurify.sanitize(preSanitized, {
      ...SVG_CONFIG,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false
    });
  }

  /**
   * Validates and sanitizes color values
   */
  static sanitizeColor(color: string): string {
    // Remove any HTML entities, scripts, or dangerous content
    const cleanColor = color
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/expression\s*\(/gi, '') // Remove CSS expressions
      .trim()
      .substring(0, 50); // Limit length

    // Validate color format
    const validColorRegex = /^(#([0-9A-Fa-f]{3}){1,2}|rgb(a)?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[0-9.]+)?\)|[a-zA-Z]+)$/;
    if (validColorRegex.test(cleanColor)) {
      return cleanColor;
    }

    // Return default color if invalid
    return '#000000';
  }

  /**
   * Validates and sanitizes URLs for SVG images
   */
  static sanitizeImageURL(url: string): string {
    if (!url) return '';

    try {
      // Parse the URL to validate it
      const parsedUrl = new URL(url, window.location.origin);
      
      // Only allow http, https, and blob protocols
      if (!['http:', 'https:', 'blob:'].includes(parsedUrl.protocol)) {
        return '';
      }

      // Remove dangerous characters
      const cleanUrl = url
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/data:script/gi, '')
        .trim()
        .substring(0, 500);

      // Additional validation for data URLs
      if (cleanUrl.startsWith('data:')) {
        const allowedDataTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
        const isAllowedImageType = allowedDataTypes.some(type => cleanUrl.includes(type));
        if (!isAllowedImageType) {
          return '';
        }
      }

      return cleanUrl;
    } catch (error) {
      console.error('URL validation error:', error);
      return '';
    }
  }

  /**
   * Securely creates an SVG with proper sanitization
   */
  static createSecureSVG(
    viewBox: string,
    content: string,
    attributes: Record<string, string> = {}
  ): string {
    // Sanitize all attributes
    const sanitizedAttributes = Object.entries(attributes).reduce((acc, [key, value]) => {
      if (SVG_CONFIG.ALLOWED_ATTR.includes(key)) {
        acc[key] = this.escapeHtmlAttribute(value);
      }
      return acc;
    }, {} as Record<string, string>);

    // Build SVG with sanitized content
    const svgTag = `<svg viewBox="${this.escapeHtmlAttribute(viewBox)}" xmlns="http://www.w3.org/2000/svg" ${Object.entries(sanitizedAttributes).map(([k, v]) => `${k}="${v}"`).join(' ')}>`;
    const fullSVG = svgTag + content + '</svg>';

    return this.sanitizeSVG(fullSVG);
  }

  /**
   * Escapes HTML attribute values
   */
  static escapeHtmlAttribute(value: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return value.replace(/[&<>"'/]/g, (match) => escapeMap[match]);
  }

  /**
   * Creates a secure path element
   */
  static createSecurePath(
    d: string,
    fill: string,
    stroke: string = '',
    strokeWidth: string = '0'
  ): string {
    const sanitizedD = this.escapeHtmlAttribute(d);
    const sanitizedFill = this.sanitizeColor(fill);
    const sanitizedStroke = this.escapeHtmlAttribute(stroke);
    const sanitizedStrokeWidth = this.escapeHtmlAttribute(strokeWidth);

    return `<path d="${sanitizedD}" fill="${sanitizedFill}" stroke="${sanitizedStroke}" stroke-width="${sanitizedStrokeWidth}"/>`;
  }

  /**
   * Creates a secure image element
   */
  static createSecureImage(
    href: string,
    x: number,
    y: number,
    width: number,
    height: number,
    preserveAspectRatio: string = 'xMidYMid slice'
  ): string {
    const sanitizedHref = this.sanitizeImageURL(href);
    if (!sanitizedHref) return '';

    const preserveAttr = this.escapeHtmlAttribute(preserveAspectRatio);
    
    return `<image href="${sanitizedHref}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${preserveAttr}" />`;
  }

  /**
   * Validates and sanitizes image URL for direct display
   * Returns sanitized URL or empty string if invalid
   */
  static validateImageURL(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      // Parse URL to validate it
      const parsedUrl = new URL(url, window.location.origin);
      
      // Only allow http, https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        console.warn('Invalid protocol for image URL:', parsedUrl.protocol);
        return '';
      }

      // Remove dangerous characters and limit length
      const cleanUrl = url
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/data:script/gi, '')
        .trim()
        .substring(0, 500);

      // Additional validation for data URLs
      if (cleanUrl.startsWith('data:')) {
        const allowedDataTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
        const isAllowedImageType = allowedDataTypes.some(type => cleanUrl.includes(type));
        if (!isAllowedImageType) {
          console.warn('Invalid data URL type for image:', cleanUrl);
          return '';
        }
      }

      return cleanUrl;
    } catch (error) {
      console.error('Image URL validation error:', error);
      return '';
    }
  }
}

// Fallback color list for validation
export const VALID_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'gray'
];

export function isValidColor(color: string): boolean {
  if (VALID_COLORS.includes(color.toLowerCase())) {
    return true;
  }
  
  // Check hex format
  if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color)) {
    return true;
  }
  
  // Check rgb/rgba format
  if (/^rgb(a)?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[0-9.]+)?\)$/.test(color)) {
    return true;
  }
  
  return false;
}