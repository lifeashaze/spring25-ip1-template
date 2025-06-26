import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/user.service';
import { SafeUser, User } from '../../types/types';

const mockUser: User = {
  _id: new mongoose.Types.ObjectId(),
  username: 'user1',
  password: 'password',
  dateJoined: new Date('2024-12-03'),
};

const mockSafeUser: SafeUser = {
  _id: mockUser._id,
  username: 'user1',
  dateJoined: new Date('2024-12-03'),
};

const mockUserJSONResponse = {
  _id: mockUser._id?.toString(),
  username: 'user1',
  dateJoined: new Date('2024-12-03').toISOString(),
};

const saveUserSpy = jest.spyOn(util, 'saveUser');
const loginUserSpy = jest.spyOn(util, 'loginUser');
const updatedUserSpy = jest.spyOn(util, 'updateUser');
const getUserByUsernameSpy = jest.spyOn(util, 'getUserByUsername');
const deleteUserByUsernameSpy = jest.spyOn(util, 'deleteUserByUsername');

describe('Test userController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /signup', () => {
    it('should create a new user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(saveUserSpy).toHaveBeenCalledWith({ ...mockReqBody, dateJoined: expect.any(Date) });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 409 when user already exists', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockRejectedValueOnce(new Error('User already exists'));

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Failed to create user: User already exists' });
      expect(saveUserSpy).toHaveBeenCalledWith({ ...mockReqBody, dateJoined: expect.any(Date) });
    });
  });

  describe('POST /login', () => {
    it('should succesfully login for a user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(loginUserSpy).toHaveBeenCalledWith(mockReqBody);
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 401 when user does not exist', async () => {
      const mockReqBody = {
        username: 'nonexistentuser',
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce({
        error: 'Failed to login user: Error: User does not exist',
      });

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Failed to login user: Invalid credentials' });
      expect(loginUserSpy).toHaveBeenCalledWith(mockReqBody);
    });

    it('should return 401 when password is incorrect', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'wrongpassword',
      };

      loginUserSpy.mockResolvedValueOnce({
        error: 'Failed to login user: Error: Invalid password',
      });

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Failed to login user: Invalid credentials' });
      expect(loginUserSpy).toHaveBeenCalledWith(mockReqBody);
    });
  });

  describe('PATCH /resetPassword', () => {
    it('should succesfully return updated user object given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...mockUserJSONResponse });
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, { password: 'newPassword' });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: 'newPassword',
      };

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username and password are required and cannot be empty',
      });
    });

    it('should return 404 when user does not exist', async () => {
      const mockReqBody = {
        username: 'nonexistentuser',
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce({ error: 'Failed to update user' });

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update user' });
      expect(updatedUserSpy).toHaveBeenCalledWith('nonexistentuser', { password: 'newPassword' });
    });
  });

  describe('GET /getUser', () => {
    it('should return the user given correct arguments', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).get(`/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(getUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 404 if username not provided', async () => {
      // Express automatically returns 404 for missing parameters when
      // defined as required in the route
      const response = await supertest(app).get('/user/getUser/');
      expect(response.status).toBe(404);
    });

    it('should return 404 when user does not exist', async () => {
      const username = 'nonexistentuser';

      getUserByUsernameSpy.mockResolvedValueOnce({
        error: 'Error when getting user: Error: User does not exist',
      });

      const response = await supertest(app).get(`/user/getUser/${username}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
      expect(getUserByUsernameSpy).toHaveBeenCalledWith(username);
    });
  });

  describe('DELETE /deleteUser', () => {
    it('should return the deleted user given correct arguments', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).delete(`/user/deleteUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(deleteUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 404 if username not provided', async () => {
      // Express automatically returns 404 for missing parameters when
      // defined as required in the route
      const response = await supertest(app).delete('/user/deleteUser/');
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid username parameter', async () => {
      const response = await supertest(app).delete('/user/deleteUser/%20');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request: username is required and cannot be empty',
      });
    });

    it('should return 404 when user does not exist', async () => {
      const username = 'nonexistentuser';

      deleteUserByUsernameSpy.mockResolvedValueOnce({
        error: 'Failed to delete user: Error: User does not exist',
      });

      const response = await supertest(app).delete(`/user/deleteUser/${username}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Failed to delete user: User does not exist' });
      expect(deleteUserByUsernameSpy).toHaveBeenCalledWith(username);
    });
  });
});
