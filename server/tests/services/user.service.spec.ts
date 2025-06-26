import UserModel from '../../models/users.model';
import {
  deleteUserByUsername,
  getUserByUsername,
  loginUser,
  saveUser,
  updateUser,
} from '../../services/user.service';
import { SafeUser, User, UserCredentials } from '../../types/user';
import { user, safeUser } from '../mockData.models';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

describe('User model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    mockingoose.resetAll();
  });

  describe('saveUser', () => {
    beforeEach(() => {
      mockingoose.resetAll();
    });

    it('should return the saved user', async () => {
      mockingoose(UserModel).toReturn(user, 'save');

      const savedUser = (await saveUser(user)) as SafeUser;

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toEqual(user.username);
      expect(savedUser.dateJoined).toEqual(user.dateJoined);
    });

    it('should throw an error when user already exists', async () => {
      mockingoose(UserModel).toReturn(user, 'findOne');

      await expect(saveUser(user)).rejects.toThrow(
        'Failed to save user: Error: User already exists',
      );
    });
  });
});

describe('getUserByUsername', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the matching user', async () => {
    mockingoose(UserModel).toReturn(safeUser, 'findOne');

    const retrievedUser = (await getUserByUsername(user.username)) as SafeUser;

    expect(retrievedUser.username).toEqual(user.username);
    expect(retrievedUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should return an error when user does not exist', async () => {
    mockingoose(UserModel).toReturn(null, 'findOne');

    const result = await getUserByUsername('nonexistentuser');

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toEqual(
      'Error when getting user: Error: User does not exist',
    );
  });
});

describe('loginUser', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the user if authentication succeeds', async () => {
    mockingoose(UserModel).toReturn(safeUser, 'findOne');

    const credentials: UserCredentials = {
      username: user.username,
      password: user.password,
    };

    const loggedInUser = (await loginUser(credentials)) as SafeUser;

    expect(loggedInUser).not.toHaveProperty('password');
    expect(loggedInUser.username).toEqual(user.username);
    expect(loggedInUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should return an error when user does not exist', async () => {
    mockingoose(UserModel).toReturn(null, 'findOne');

    const credentials: UserCredentials = {
      username: 'nonexistentuser',
      password: 'password',
    };

    const result = await loginUser(credentials);

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toEqual(
      'Failed to login user: Error: User does not exist',
    );
  });

  it('should return an error when password is invalid', async () => {
    mockingoose(UserModel).toReturn(user, 'findOne');

    const credentials: UserCredentials = {
      username: user.username,
      password: 'wrongpassword',
    };

    const result = await loginUser(credentials);

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toEqual(
      'Failed to login user: Error: Invalid password',
    );
  });

  it('should return an error when username is empty', async () => {
    const credentials: UserCredentials = {
      username: '',
      password: 'password',
    };

    const result = await loginUser(credentials);

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toEqual(
      'Failed to login user: Error: User does not exist',
    );
  });

  it('should return an error when password is empty', async () => {
    mockingoose(UserModel).toReturn(user, 'findOne');

    const credentials: UserCredentials = {
      username: user.username,
      password: '',
    };

    const result = await loginUser(credentials);

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toEqual(
      'Failed to login user: Error: Invalid password',
    );
  });
});

describe('deleteUserByUsername', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the deleted user when deleted succesfully', async () => {
    mockingoose(UserModel).toReturn(safeUser, 'findOneAndDelete');

    const deletedUser = (await deleteUserByUsername(user.username)) as SafeUser;

    expect(deletedUser.username).toEqual(user.username);
    expect(deletedUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should return an error when user does not exist', async () => {
    mockingoose(UserModel).toReturn(null, 'findOneAndDelete');

    const result = await deleteUserByUsername('nonexistentuser');

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toEqual(
      'Failed to delete user: Error: User does not exist',
    );
  });

  it('should handle empty username', async () => {
    mockingoose(UserModel).toReturn(null, 'findOneAndDelete');

    const result = await deleteUserByUsername('');

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toEqual(
      'Failed to delete user: Error: User does not exist',
    );
  });
});

describe('updateUser', () => {
  const updatedUser: User = {
    ...user,
    password: 'newPassword',
  };

  const safeUpdatedUser: SafeUser = {
    username: user.username,
    dateJoined: user.dateJoined,
  };

  const updates: Partial<User> = {
    password: 'newPassword',
  };

  beforeEach(() => {
    mockingoose.resetAll();
  });

  it('should return the updated user when updated succesfully', async () => {
    mockingoose(UserModel).toReturn(safeUpdatedUser, 'findOneAndUpdate');

    const result = (await updateUser(user.username, updates)) as SafeUser;

    expect(result.username).toEqual(user.username);
    expect(result.username).toEqual(updatedUser.username);
    expect(result.dateJoined).toEqual(user.dateJoined);
    expect(result.dateJoined).toEqual(updatedUser.dateJoined);
  });

  it('should return an error when user does not exist', async () => {
    mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');

    const result = await updateUser('nonexistentuser', updates);

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toEqual('Failed to update user');
  });

  it('should handle partial updates correctly', async () => {
    const partialUpdates = { password: 'newPassword123' };
    const expectedUpdatedUser = {
      username: user.username,
      dateJoined: user.dateJoined,
    };

    mockingoose(UserModel).toReturn(expectedUpdatedUser, 'findOneAndUpdate');

    const result = (await updateUser(user.username, partialUpdates)) as SafeUser;

    expect(result.username).toEqual(user.username);
    expect(result.dateJoined).toEqual(user.dateJoined);
    expect(result).not.toHaveProperty('password');
  });

  it('should handle empty username', async () => {
    mockingoose(UserModel).toReturn(null, 'findOneAndUpdate');

    const result = await updateUser('', updates);

    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toEqual('Failed to update user');
  });

  it('should handle empty updates object', async () => {
    mockingoose(UserModel).toReturn(safeUpdatedUser, 'findOneAndUpdate');

    const result = (await updateUser(user.username, {})) as SafeUser;

    expect(result.username).toEqual(user.username);
    expect(result.dateJoined).toEqual(user.dateJoined);
  });
});
