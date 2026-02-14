import { z } from 'zod';

// File validation schemas
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFileName?: string;
}

export class SecureFileValidator {
  /**
   * Validates an uploaded file for security
   */
  static async validateFile(file: File): Promise<FileValidationResult> {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`
      };
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
      };
    }

    // Additional MIME type verification by checking file signature
    const isValidSignature = await this.verifyFileSignature(file);
    if (!isValidSignature) {
      return {
        isValid: false,
        error: 'File content does not match its extension. This may be a malicious file.'
      };
    }

    // Sanitize filename
    const sanitizedFileName = this.sanitizeFileName(file.name);

    return {
      isValid: true,
      sanitizedFileName
    };
  }

  /**
   * Verifies file signature to prevent extension spoofing
   */
  private static async verifyFileSignature(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 12);
        const header = Array.from(arr).map(byte => byte.toString(16).padStart(2, '0')).join('');

        // JPEG signatures
        if (header.startsWith('ffd8')) {
          resolve(file.type.startsWith('image/jpeg'));
          return;
        }

        // PNG signatures
        if (header.startsWith('89504e47')) {
          resolve(file.type === 'image/png');
          return;
        }

        // WebP signatures
        if (header.startsWith('52494646') && header.substring(16, 24) === '57454250') {
          resolve(file.type === 'image/webp');
          return;
        }

        resolve(false);
      };
      reader.readAsArrayBuffer(file.slice(0, 12));
    });
  }

  /**
   * Sanitizes filename to prevent path traversal and injection attacks
   */
  private static sanitizeFileName(fileName: string): string {
    // Remove path traversal characters
    let sanitized = fileName.replace(/[\/\\]/g, '_');
    
    // Remove special characters that could cause issues
    sanitized = sanitized.replace(/[<>:"|?*]/g, '_');
    
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '');
    
    // Limit filename length
    if (sanitized.length > 255) {
      const extension = sanitized.split('.').pop() || '';
      const nameWithoutExt = sanitized.substring(0, 255 - extension.length - 1);
      sanitized = `${nameWithoutExt}.${extension}`;
    }
    
    // Ensure filename doesn't start with a dot (hidden files)
    if (sanitized.startsWith('.')) {
      sanitized = 'file_' + sanitized;
    }

    // Add timestamp to prevent filename collisions
    const timestamp = Date.now();
    const parts = sanitized.split('.');
    if (parts.length > 1) {
      const extension = parts.pop();
      const name = parts.join('.');
      return `${name}_${timestamp}.${extension}`;
    } else {
      return `${sanitized}_${timestamp}`;
    }
  }

  /**
   * Creates a safe preview URL that can be revoked later
   */
  static createSafePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revokes a preview URL to free memory
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Validates image dimensions (optional)
   */
  static async validateImageDimensions(
    file: File, 
    maxWidth: number = 4096, 
    maxHeight: number = 4096
  ): Promise<{ isValid: boolean; error?: string; width?: number; height?: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        const { width, height } = img;
        URL.revokeObjectURL(objectUrl);
        
        if (width > maxWidth || height > maxHeight) {
          resolve({
            isValid: false,
            error: `Image dimensions must be less than ${maxWidth}x${maxHeight}px`,
            width,
            height
          });
          return;
        }

        if (width < 50 || height < 50) {
          resolve({
            isValid: false,
            error: `Image dimensions must be at least 50x50px`,
            width,
            height
          });
          return;
        }

        resolve({ isValid: true, width, height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ isValid: false, error: 'Invalid image file' });
      };
      
      img.src = objectUrl;
    });
  }
}

// Zod schema for form validation
export const FileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= MAX_FILE_SIZE,
    `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
  ).refine(
    (file) => ALLOWED_MIME_TYPES.includes(file.type),
    'Only JPEG, PNG, and WebP images are allowed'
  ).refine(
    (file) => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return ALLOWED_EXTENSIONS.includes(extension);
    },
    `Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`
  )
});