import UserModel from '../models/users.model';
import { SafeUser, User, UserCredentials, UserResponse } from '../types/types';

/**
 * Converts a User document to a SafeUser object by removing sensitive fields like password.
 * Handles both Mongoose documents and plain objects.
 *
 * @param {any} user - The user document or object to sanitize
 * @returns {SafeUser} - A sanitized user object without password field
 */
const sanitizeUserForResponse = (user: any): SafeUser => {
  const userObj = user.toObject ? user.toObject() : user;
  const { password, ...safeUser } = userObj;
  return safeUser as SafeUser;
};

/**
 * Saves a new user to the database.
 *
 * @param {User} user - The user object to be saved, containing user details like username, password, etc.
 * @returns {Promise<UserResponse>} - Resolves with the saved user object (without the password) or an error message.
 */
export const saveUser = async (user: User): Promise<UserResponse> => {
  try {
    const existingUser = await UserModel.findOne({ username: user.username });

    if (existingUser) {
      throw Error('User already exists');
    }

    const newUser = new UserModel(user);
    const savedUser = await newUser.save();
    return sanitizeUserForResponse(savedUser);
  } catch (error) {
    throw Error(`Failed to save user: ${error}`);
  }
};

/**
 * Retrieves a user from the database by their username.
 *
 * @param {string} username - The username of the user to find.
 * @returns {Promise<UserResponse>} - Resolves with the found user object (without the password) or an error message.
 */
export const getUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const user = await UserModel.findOne({ username });

    if (!user) {
      throw Error('User does not exist');
    }
    return sanitizeUserForResponse(user);
  } catch (error) {
    return { error: `Error when getting user: ${error}` };
  }
};

/**
 * Authenticates a user by verifying their username and password.
 *
 * @param {UserCredentials} loginCredentials - An object containing the username and password.
 * @returns {Promise<UserResponse>} - Resolves with the authenticated user object (without the password) or an error message.
 */
export const loginUser = async (loginCredentials: UserCredentials): Promise<UserResponse> => {
  const { username, password } = loginCredentials;

  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      throw Error('User does not exist');
    }

    const userObj = user.toObject ? user.toObject() : user;
    if (userObj.password !== undefined && userObj.password !== password) {
      throw Error('Invalid password');
    }

    return sanitizeUserForResponse(user);
  } catch (error) {
    return { error: `Failed to login user: ${error}` };
  }
};

/**
 * Deletes a user from the database by their username.
 *
 * @param {string} username - The username of the user to delete.
 * @returns {Promise<UserResponse>} - Resolves with the deleted user object (without the password) or an error message.
 */
export const deleteUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const user = await UserModel.findOneAndDelete({ username });
    if (!user) {
      throw Error('User does not exist');
    }
    return sanitizeUserForResponse(user);
  } catch (error) {
    return { error: `Failed to delete user: ${error}` };
  }
};

/**
 * Updates user information in the database.
 *
 * @param {string} username - The username of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateUser = async (
  username: string,
  updates: Partial<User>,
): Promise<UserResponse> => {
  try {
    const user = await UserModel.findOneAndUpdate({ username }, updates, { new: true });
    if (!user) {
      throw Error('User does not exist');
    }
    return sanitizeUserForResponse(user);
  } catch (error) {
    return { error: 'Failed to update user' } as UserResponse;
  }
};
