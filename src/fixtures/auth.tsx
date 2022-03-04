import React from "react";
import { AuthContext, AuthContextValue } from "auth/context";
import { defaults, noop } from "lodash";

export const fakeAuthContextValue = (
  value?: Partial<AuthContextValue>
): AuthContextValue =>
  defaults(value, {
    isAuthenticated: false,
    isAdmin: false,
    error: null,
    forgotPassword: noop,
    login: noop,
    logout: noop,
    refreshUser: noop,
    resetPassword: noop,
    setPassword: noop,
    user: null,
    userInitialised: true,
    updateUser: noop,
  } as AuthContextValue);

export const mockAuthContext = (
  value?: Partial<AuthContextValue>
) => (): AuthContextValue => fakeAuthContextValue(value);

export const MockAuthProvider: React.FC<{
  value?: Partial<AuthContextValue>;
}> = ({ value, children }) => (
  <AuthContext.Provider value={fakeAuthContextValue(value)}>
    {children}
  </AuthContext.Provider>
);
