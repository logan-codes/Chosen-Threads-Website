import { describe, it, expect } from '@jest/globals';
import { SecureFileValidator, FileUploadSchema } from '@/lib/fileSecurity';

describe('fileSecurity', () => {
  describe('SecureFileValidator.validateFile', () => {
    it('should return valid for PNG file', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = await SecureFileValidator.validateFile(file);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for file over size limit', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      
      const result = await SecureFileValidator.validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size must be less than');
    });

    it('should validate correct file extensions', async () => {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      
      for (const ext of validExtensions) {
        const file = new File(['test'], `test${ext}`, { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 1024 });
        const result = await SecureFileValidator.validateFile(file);
        expect(result.isValid).toBe(true);
      }
    });

    it('should reject files with disallowed extensions', async () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      const result = await SecureFileValidator.validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Only .jpg');
    });
  });

  describe('FileUploadSchema', () => {
    it('should be defined', () => {
      expect(FileUploadSchema).toBeDefined();
    });
  });
});
