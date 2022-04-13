import React from "react";
import { Route, Switch } from "react-router-dom";
import AdminRoute from "navigation/routes/AdminRoute";
import GuestRoute from "navigation/routes/GuestRoute";
import ProtectedRoute from "navigation/routes/ProtectedRoute";
import { useAuth } from "auth/context";
import AccountPage from "auth/pages/AccountPage";
import LoginPage from "auth/pages/LoginPage";
import PasswordPage from "auth/pages/PasswordPage";
import PasswordResetPage from "auth/pages/PasswordResetPage";
import ForgotPasswordPage from "auth/pages/ForgotPasswordPage";
import NotFoundPage from "navigation/pages/NotFoundPage";
import LoadingPage from "common/pages/LoadingPage";
import ErrorPage from "common/pages/ErrorPage";
import SettingsPage from "settings/pages/SettingsPage";
import TimesheetFormPage from "timesheets/pages/TimesheetFormPage";
import TimesheetIndexPage from "timesheets/pages/TimesheetIndexPage";
import TimesheetViewPage from "timesheets/pages/TimesheetViewPage";
import UserIndexPage from "users/pages/UserIndexPage";
import UserFormPage from "users/pages/UserFormPage";
import UserDeletePage from "users/pages/UserDeletePage";

const App: React.FC = () => {
  const { userInitialised, error } = useAuth();

  if (error !== null) {
    return <ErrorPage message={error} />;
  }

  if (!userInitialised) {
    return <LoadingPage />;
  }

  return (
    <Switch>
      <ProtectedRoute exact path="/">
        <TimesheetIndexPage />
      </ProtectedRoute>
      <ProtectedRoute exact path="/timesheet/new">
        <TimesheetFormPage />
      </ProtectedRoute>
      <ProtectedRoute exact path="/timesheet/:id">
        <TimesheetViewPage />
      </ProtectedRoute>
      <ProtectedRoute exact path="/account">
        <AccountPage />
      </ProtectedRoute>
      <ProtectedRoute exact path="/account/password">
        <PasswordPage />
      </ProtectedRoute>
      <AdminRoute exact path="/settings">
        <SettingsPage />
      </AdminRoute>
      <AdminRoute exact path="/users">
        <UserIndexPage />
      </AdminRoute>
      <AdminRoute exact path="/users/new">
        <UserFormPage />
      </AdminRoute>
      <AdminRoute exact path="/users/:id">
        <UserFormPage />
      </AdminRoute>
      <AdminRoute exact path="/users/:id/delete">
        <UserDeletePage />
      </AdminRoute>
      <GuestRoute exact path="/login">
        <LoginPage />
      </GuestRoute>
      <GuestRoute exact path="/forgot-password">
        <ForgotPasswordPage />
      </GuestRoute>
      <GuestRoute exact path="/reset-password/:email/:token">
        <PasswordResetPage />
      </GuestRoute>
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  );
};

export default App;
