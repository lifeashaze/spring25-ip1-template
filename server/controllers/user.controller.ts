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

    if (!username ||
      !password ||
      username.trim() === '' ||
      password.trim() === '') {
      return false;
    }

    return true;
  };

  /**
   * Validates that the username parameter is not empty.
   * @param req The incoming request containing the username as a route parameter.
   * @returns `true` if the username parameter is not empty; otherwise, `false`.
   */
  const isUserNameParameterValid = (req: UserByUsernameRequest): boolean => {
    const { username } = req.params;
    return username && username.trim() !== '' ? true : false;
  };

  /**
   * Handles the creation of a new user account.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the created user or an error.
   * @returns A promise resolving to void.
   */
  const createUser = async (req: UserRequest, res: Response): Promise<void> => {
    if (!isUserBodyValid(req)) {
      res.status(400).json({ error: 'Invalid request: username and password are required and cannot be empty' });
      return;
    }

    const user: User = {
      ...req.body,
      dateJoined: new Date(),
    };

    try {
      const userResponse = await saveUser(user);
      res.status(201).json(userResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('User already exists')) {
        res.status(409).json({ error: 'Failed to create user: User already exists' });
        return;
      }

      res.status(500).json({ error: `Failed to create user: ${errorMessage}` });
    }
  };

  /**
   * Handles user login by validating credentials.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const userLogin = async (req: UserRequest, res: Response): Promise<void> => {
    if (!isUserBodyValid(req)) {
      res.status(400).json({ error: 'Invalid request: username and password are required and cannot be empty' });
      return;
    }

    try {
      const user: UserCredentials = req.body;
      const userResponse = await loginUser(user);

      if ('error' in userResponse) {
        const errorMessage = userResponse.error;

        if (errorMessage.includes('User does not exist')) {
          res.status(401).json({ error: 'Failed to login user: Invalid credentials' });
          return;
        }

        if (errorMessage.includes('Invalid password')) {
          res.status(401).json({ error: 'Failed to login user: Invalid credentials' });
          return;
        }

        res.status(500).json({ error: userResponse.error });
        return;
      }

      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ error: `Failed to login user: ${error}` });
    }
  };

  /**
   * Retrieves a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const getUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    const username = req.params.username;

    if (!isUserNameParameterValid(req)) {
      res.status(400).json({ error: 'Invalid request: username is required and cannot be empty' });
      return;
    }

    try {
      const userResponse = await getUserByUsername(username);

      if ('error' in userResponse) {
        const errorMessage = userResponse.error;

        if (errorMessage.includes('User does not exist')) {
          res.status(404).json({ error: 'User not found' });
          return;
        }

        res.status(500).json({ error: errorMessage });
        return;
      }

      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ error: `Failed to get user: ${error}` });
    }
  };

  /**
   * Deletes a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either the successfully deleted user object or returning an error.
   * @returns A promise resolving to void.
   */
  const deleteUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    const username = req.params.username;

    if (!isUserNameParameterValid(req)) {
      res.status(400).json({ error: 'Invalid request: username is required and cannot be empty' });
      return;
    }
    try {
      const deletedUser = await deleteUserByUsername(username);

      if ('error' in deletedUser) {
        if (deletedUser.error.includes('User does not exist')) {
          res.status(404).json({ error: 'Failed to delete user: User does not exist' });
          return;
        }

        res.status(500).json({ error: deletedUser.error });
        return;
      }

      res.status(200).json(deletedUser);
    } catch (error) {
      res.status(500).json({ error: `Failed to delete user: ${error}` });
    }
  };

  /**
   * Resets a user's password.
   * @param req The request containing the username and new password in the body.
   * @param res The response, either the successfully updated user object or returning an error.
   * @returns A promise resolving to void.
   */
  const resetPassword = async (req: UserRequest, res: Response): Promise<void> => {
    if (!isUserBodyValid(req)) {
      res.status(400).json({ error: 'Invalid request: username and password are required and cannot be empty' });
      return;
    }

    const { username, password } = req.body;

    try {
      const updatedUser = await updateUser(username, { password });

      if ('error' in updatedUser) {
        const errorMessage = updatedUser.error;

        if (errorMessage.includes('User does not exist')) {
          res.status(404).json({ error: 'Failed to update user password: User not found' });
          return;
        }

        res.status(500).json({ error: updatedUser.error });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: `Failed to update user password: ${error}` });
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
