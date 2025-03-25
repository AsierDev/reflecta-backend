import { registerSchema, loginSchema } from '../auth.schema';

describe('Authentication Schemas', () => {
  describe('registerSchema', () => {
    test('should validate correct registration data', () => {
      const validData = {
        body: {
          name: 'Example User',
          email: 'user@example.com',
          password: 'Password1@'
        }
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
      const invalidData = {
        body: {
          name: 'Example User',
          email: 'not-an-email',
          password: 'Password1@'
        }
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formattedErrors = result.error.format();
        expect(formattedErrors.body?.email?._errors).toBeDefined();
      }
    });

    test('should reject name that is too short', () => {
      const invalidData = {
        body: {
          name: 'Us',
          email: 'user@example.com',
          password: 'Password1@'
        }
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formattedErrors = result.error.format();
        expect(formattedErrors.body?.name?._errors).toBeDefined();
      }
    });

    test('should reject password that is too short', () => {
      const invalidData = {
        body: {
          name: 'Example User',
          email: 'user@example.com',
          password: 'Pass1@'
        }
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formattedErrors = result.error.format();
        expect(formattedErrors.body?.password?._errors).toBeDefined();
      }
    });

    test('should reject password without required complexity', () => {
      const invalidData = {
        body: {
          name: 'Example User',
          email: 'user@example.com',
          password: 'password12345'
        }
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formattedErrors = result.error.format();
        expect(formattedErrors.body?.password?._errors).toBeDefined();
      }
    });
  });

  describe('loginSchema', () => {
    test('should validate correct login data', () => {
      const validData = {
        body: {
          email: 'user@example.com',
          password: 'any-password'
        }
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
      const invalidData = {
        body: {
          email: 'not-an-email',
          password: 'any-password'
        }
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formattedErrors = result.error.format();
        expect(formattedErrors.body?.email?._errors).toBeDefined();
      }
    });

    test('should reject empty password', () => {
      const invalidData = {
        body: {
          email: 'user@example.com',
          password: ''
        }
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formattedErrors = result.error.format();
        expect(formattedErrors.body?.password?._errors).toBeDefined();
      }
    });
  });
});
