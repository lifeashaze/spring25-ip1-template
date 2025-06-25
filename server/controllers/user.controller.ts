import express, { Response, Router } from 'express';
import { UserRequest, User, UserCredentials, UserByUsernameRequest } from '../types/types';
import {
  deleteUserByUsername,
  getUserByUsername,
  loginUser,
  saveUser,
  updateUser,
} from '../services/user.service';

const userController = () => {
  const router: Router = express.Router();
  
  /**
   * Validates that the request body contains all required fields for a user.
   * @param req The incoming request containing user data.
   * @returns `true` if the body contains valid user fields; otherwise, `false`.
   */
  const isUserBodyValid = (req: UserRequest): boolean => {
    const { username, password } = req.body;
    if (!username || !password ) {
      return false;
    }
    return true;  
  };

  /**
   * Handles the creation of a new user account.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the created user or an error.
   * @returns A promise resolving to void.
   */
  const createUser = async (req: UserRequest, res: Response): Promise<void> => {
    if (!isUserBodyValid(req)) {
      res.status(400).send('Invalid request');
      return;
    }
    const user: User = {
      ...req.body,
      dateJoined: new Date(),
    };

    try {
      const userResponse = await saveUser(user);
      res.status(201).send(userResponse);
    } catch (error) {
      res.status(500).send('Failed to create user');
    }
  };

  /**
   * Handles user login by validating credentials.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const userLogin = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const user: UserCredentials = req.body;
      const userResponse = await loginUser(user);
      res.status(200).send(userResponse);
    } catch (error) {
      res.status(500).send('Failed to login user');
    }
  };

  /**
   * Retrieves a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const getUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const username = req.params.username;
      const userResponse = await getUserByUsername(username);
      res.status(200).send(userResponse);
    } catch (error) {
      res.status(500).send('Failed to get user');
    }
  };

  /**
   * Deletes a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either the successfully deleted user object or returning an error.
   * @returns A promise resolving to void.
   */
  const deleteUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const username = req.params.username;
      const userResponse = await deleteUserByUsername(username);
      res.status(200).send(userResponse);
    } catch (error) {
      res.status(500).send('Failed to delete user');
    }
  };

  /**
   * Resets a user's password.
   * @param req The request containing the username and new password in the body.
   * @param res The response, either the successfully updated user object or returning an error.
   * @returns A promise resolving to void.
   */
  const resetPassword = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const username = req.params.username;
      const updates: Partial<User> = req.body;
      const userResponse = await updateUser(username, updates);
      res.status(200).send(userResponse);
    } catch (error) {
      res.status(500).send('Failed to reset password');
    }
  };

  // Define routes for the user-related operations.
  router.post('/signup', createUser as any);
  router.post('/login', userLogin as any);
  router.patch('/resetPassword', resetPassword as any);
  router.get('/getUser/:username', getUser as any);
  router.delete('/deleteUser/:username', deleteUser as any);

  return router;
};

export default userController;
