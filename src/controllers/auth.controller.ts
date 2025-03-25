import { Request, Response } from 'express';
import authService from '../services/auth.service';
import logger from '../utils/logger';

// User registration
export const register = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const ipAddress = req.ip;

    // Register user using the service
    const authData = await authService.registerUser(userData, ipAddress);

    logger.info(`User registered successfully: ${userData.email}`);

    // Return success response
    return res.status(201).json({
      success: true,
      data: authData
    });
  } catch (error: any) {
    logger.error('Registration error', { error, ip: req.ip });

    // Return error response
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Error during registration'
    });
  }
};

// User login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    // Login user using the service
    const authData = await authService.loginUser({ email, password }, ipAddress);

    logger.info(`Successful login: ${email}`);

    // Return success response
    return res.json({
      success: true,
      data: authData
    });
  } catch (error: any) {
    logger.error('Login error', { error, ip: req.ip });

    // Return error response
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Error during login'
    });
  }
};

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    // Get user ID from request (added by auth middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get user profile using the service
    const userProfile = await authService.getUserProfile(userId);

    // Return success response
    return res.json({
      success: true,
      data: userProfile
    });
  } catch (error: any) {
    logger.error('Error retrieving user profile', { error, userId: req.user?.userId });

    // Return error response
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Error retrieving user profile'
    });
  }
};
