import request from 'supertest';
import app from '../app';
import logger from '../utils/logger';

// Logger mock
jest.mock('../utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  http: jest.fn()
}));

describe('Express Application', () => {
  test('should respond with 200 on health route', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'up');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('should respond with 404 for non-existing routes', async () => {
    const response = await request(app).get('/non-existing-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: 'Route not found'
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'Route not found: GET /non-existing-route',
      expect.objectContaining({
        method: 'GET',
        url: '/non-existing-route'
      })
    );
  });

  test('should correctly configure API routes', async () => {
    // Verify that API routes respond (even if they return authentication error)
    const authResponse = await request(app).get('/api/auth/profile');
    expect(authResponse.status).toBe(401); // Should require authentication

    const entriesResponse = await request(app).get('/api/entries');
    expect(entriesResponse.status).toBe(401); // Should require authentication

    const tagsResponse = await request(app).get('/api/tags');
    expect(tagsResponse.status).toBe(401); // Should require authentication
  });

  test('should configure JSON middleware', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .set('Content-Type', 'application/json');

    // Although authentication fails, the server should process the JSON
    expect(response.status).not.toBe(400);
  });
});
