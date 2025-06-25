import { Request } from 'express';
import { ObjectId } from 'mongodb';

/**
 * Interface representing user credentials, which contain:
 * - username - The unique username of the user
 * - password - The user's password (stored in plain text)
 */
export interface UserCredentials {
  username: string;
  password: string;
}

/**
 * Interface representing a User document, which contains:
 * - _id - The unique identifier for the user. Optional field
 * - username - The unique username of the user
 * - password - The user's password
 * - dateJoined - The date when the user registered
 */
export interface User extends UserCredentials {
  _id?: ObjectId;
  username: string;
  password: string;
  dateJoined: Date;
}

/**
 * Interface extending Express Request for routes handling user login requests.
 * Ensures that the request body contains:
 * - username - The username submitted in the request
 * - password - The password submitted in the request
 */
export interface UserRequest extends Request {
  username: string;
  password: string;
}

/**
 * Interface extending Express Request for routes querying a user by username.
 * Ensures that the request params include:
 * - username - The username provided as a route parameter
 */
export interface UserByUsernameRequest extends Request {
  username: string;
}

/**
 * Type representing a "safe" user object, which excludes sensitive fields like `password`.
 * This is used for responses where exposing the password is not allowed.
 */
export type SafeUser = Omit<User, 'password'>;

/**
 * Type representing the response for user-related operations, which can be:
 * - SafeUser - A safe user object (if the operation is successful)
 * - error - An object containing an error message (if the operation fails)
 */
export type UserResponse = SafeUser | { error: string };
