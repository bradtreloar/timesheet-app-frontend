import React, { useContext, createContext, useCallback } from "react";
import * as auth from "datastore/auth";
import { CurrentUser } from "./types";

type Status = "idle" | "pending" | "fulfilled" | "rejected";

export interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userInitialised: boolean;
  user: CurrentUser | null;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  resetPassword: (
    email: string,
    token: string,
    password: string
  ) => Promise<void>;
  updateUser: (attributes: CurrentUser) => Promise<void>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

/**
 * Custom hook. Returns the auth context. Only works inside components wrapped
 * by AuthProvider.
 */
export const useAuth = () => {
  const authContext = useContext(AuthContext);
  if (authContext === undefined) {
    throw new Error("AuthContext is undefined");
  }
  return authContext;
};

const AuthProvider: React.FC = ({ children }) => {
  const [userInitialised, setUserInitialised] = React.useState(false);
  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const isAuthenticated = user !== null;
  const isAdmin = user !== null && user.isAdmin;

  const refreshUser = useCallback(async () => {
    const currentUser = await auth.fetchCurrentUser();
    setUser(currentUser);
  }, [setUser]);

  const login = async (email: string, password: string, remember: boolean) => {
    try {
      const user = await auth.login(email, password, remember);
      setUser(user);
    } catch (error: any) {
      if (error instanceof auth.InvalidLoginException) {
        throw new Error(`Unrecognised email or password.`);
      } else {
        console.error(error);
        throw new Error(`Unable to log in. An error has occurred.`);
      }
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      setUser(null);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setUserInitialised(false);
      }
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await auth.forgotPassword(email);
    } catch (error: any) {
      if (error.response?.status === 422) {
        throw new Error(`Unable to find a user with that email address.`);
      }
      if (error.response?.status === 429) {
        throw new Error(`Too many requests.`);
      }
      throw new Error(`Unable to request password reset.`);
    }
  };

  const setPassword = async (password: string) => {
    try {
      await auth.setPassword(password);
    } catch (error) {
      throw new Error(`Unable to set password.`);
    }
  };

  const resetPassword = async (
    email: string,
    token: string,
    password: string
  ) => {
    try {
      await auth.resetPassword(email, token, password);
    } catch (error) {
      throw new Error(`Unable to reset password.`);
    }
  };

  const updateUser = async (user: CurrentUser) => {
    try {
      const updatedUser = await auth.updateUser(user);
      setUser(updatedUser);
    } catch (error) {
      throw new Error(`Unable to update user.`);
    }
  };

  React.useEffect(() => {
    if (!userInitialised) {
      (async () => {
        try {
          await refreshUser();
          setUserInitialised(true);
        } catch (error: any) {
          if (error.isAxiosError && error.response === undefined) {
            setError(`The app has run into a problem.`);
          }
        }
      })();
    }
  }, [userInitialised, refreshUser]);

  const value = {
    isAuthenticated,
    isAdmin,
    userInitialised,
    user,
    refreshUser,
    login,
    logout,
    forgotPassword,
    setPassword,
    resetPassword,
    updateUser,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
