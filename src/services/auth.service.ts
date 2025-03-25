import bcrypt from 'bcrypt';
        import jwt from 'jsonwebtoken';
        import logger from '../utils/logger';
        import prisma from '../lib/prisma';

        // User interface
        interface UserData {
          email: string;
          name?: string;
          password: string;
        }

        interface CustomError extends Error {
          statusCode?: number;
        }

        // Login data interface
        interface LoginData {
          email: string;
          password: string;
        }

        // Auth response interface
        interface AuthResponse {
          user: {
            id: string;
            email: string;
            name: string | null;
          };
          token: string;
        }

        /**
         * Authentication Service
         *
         * Handles registration, login, and user management.
         *
         * Note: The LoginAttempt functionality is partially implemented.
         * To complete it, uncomment and adapt the marked code.
         */
        class AuthService {
          // Check if user has exceeded login attempts limit
          private async checkLoginAttempts(email: string, ipAddress?: string) {
            try {
              // Count recent login attempts
              const attemptCount = await prisma.loginAttempt.count({
                where: {
                  email,
                  ipAddress,
                  createdAt: {
                    gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
                  },
                  success: false
                }
              });

              // If too many attempts, block login
              if (attemptCount >= 5) {
                logger.warn(`Too many failed login attempts for ${email}`, {
                  attemptCount,
                  ipAddress
                });

                throw Object.assign(
                  new Error('Account temporarily locked due to too many failed attempts'),
                  { statusCode: 429 }
                );
              }
            } catch (error) {
              if (error instanceof Error) {
                logger.error('Error checking login attempts', { error: error.message, email });
              } else {
                logger.error('Error checking login attempts', { error: String(error), email });
              }
            }
          }

          // Record login attempt
          private async recordLoginAttempt(email: string, success: boolean, ipAddress?: string) {
            try {
              await prisma.loginAttempt.create({
                data: {
                  email,
                  ipAddress,
                  success,
                  createdAt: new Date()
                }
              });
            } catch (error) {
              if (error instanceof Error) {
                logger.error('Error recording login attempt', { error: error.message, email });
              } else {
                logger.error('Error recording login attempt', { error: String(error), email });
              }
            }
          }

          // Register new user
          async registerUser(userData: UserData, ipAddress?: string): Promise<AuthResponse> {
            try {
              // Check if user already exists
              const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
              });

              if (existingUser) {
                throw Object.assign(new Error('User already exists'), { statusCode: 400 });
              }

              // Hash password
              const salt = await bcrypt.genSalt(10);
              const passwordHash = await bcrypt.hash(userData.password, salt);

              // Create user
              const newUser = await prisma.user.create({
                data: {
                  email: userData.email,
                  name: userData.name,
                  passwordHash
                }
              });

              // Generate JWT
              const token = this.generateToken(newUser.id);

              logger.info(`New user registered: ${userData.email}`, { userId: newUser.id });

              return {
                user: {
                  id: newUser.id,
                  email: newUser.email,
                  name: newUser.name
                },
                token
              };
            } catch (error) {
              if (error instanceof Error) {
                logger.error('User registration error', { error: error.message, email: userData.email });
              } else {
                logger.error('User registration error', { error: String(error), email: userData.email });
              }
              const customError = error as CustomError;
              throw customError.statusCode
                ? customError
                : Object.assign(new Error('Error registering user'), { statusCode: 500 });
            }
          }

          // Login user
          async loginUser(loginData: LoginData, ipAddress?: string): Promise<AuthResponse> {
            try {
              // Check for too many login attempts
              await this.checkLoginAttempts(loginData.email, ipAddress);

              // Find user
              const user = await prisma.user.findUnique({
                where: { email: loginData.email }
              });

              // If user not found or password invalid
              if (!user) {
                await this.recordLoginAttempt(loginData.email, false, ipAddress);
                throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
              }

              // Compare password
              const validPassword = await bcrypt.compare(loginData.password, user.passwordHash);

              if (!validPassword) {
                await this.recordLoginAttempt(loginData.email, false, ipAddress);
                throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
              }

              // Record successful login
              await this.recordLoginAttempt(loginData.email, true, ipAddress);

              // Generate JWT
              const token = this.generateToken(user.id);

              logger.info(`User logged in: ${loginData.email}`, { userId: user.id });

              return {
                user: {
                  id: user.id,
                  email: user.email,
                  name: user.name
                },
                token
              };
            } catch (error) {
              if (error instanceof Error) {
                logger.error('Login error', { error: error.message, email: loginData.email });
              } else {
                logger.error('Login error', { error: String(error), email: loginData.email });
              }
              const customError = error as CustomError;
              throw customError.statusCode
                ? customError
                : Object.assign(new Error('Error during login'), { statusCode: 500 });
            }
          }

          // Get user profile
          async getUserProfile(userId: string) {
            try {
              const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  createdAt: true
                }
              });

              if (!user) {
                throw Object.assign(new Error('User not found'), { statusCode: 404 });
              }

              return user;
            } catch (error) {
              if (error instanceof Error) {
                logger.error('Error getting user profile', { error: error.message, userId });
              } else {
                logger.error('Error getting user profile', { error: String(error), userId });
              }
              const customError = error as CustomError;
              throw customError.statusCode
                ? customError
                : Object.assign(new Error('Error retrieving user profile'), { statusCode: 500 });
            }
          }

          // Generate JWT token
          private generateToken(userId: string): string {
            const secret = process.env.JWT_SECRET;

            if (!secret) {
              logger.error('JWT_SECRET not defined');
              throw Object.assign(new Error('Server configuration error'), { statusCode: 500 });
            }

            return jwt.sign({ userId }, secret as jwt.Secret, {
              expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn']
            });
          }
        }

        export default new AuthService();