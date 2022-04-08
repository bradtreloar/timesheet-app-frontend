import React, { useEffect } from "react";
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
import { useThunkDispatch } from "store/createStore";
import { actions as timesheetActions } from "timesheets/store/timesheets";
import { actions as settingsActions } from "settings/store/settings";
import { actions as userActions } from "users/store/users";
import { CurrentUser } from "auth/types";

const initialiseStore = async (user: CurrentUser) => {
  const dispatch = useThunkDispatch();
  dispatch(timesheetActions.fetchAllBelongingTo(user.id));
  dispatch(settingsActions.fetchAll());
  if (user.isAdmin) {
    dispatch(userActions.fetchAll());
  }
};

const clearStore = async () => {
  const dispatch = useThunkDispatch();
  dispatch(timesheetActions.clear());
  dispatch(settingsActions.clear());
  dispatch(userActions.clear());
};

const App: React.FC = () => {
  const [storeInitialised, setStoreInitialised] = React.useState(false);
  const { user, userInitialised, error: authError } = useAuth();

  useEffect(() => {
    if (userInitialised && user !== null && !storeInitialised) {
      (async () => {
        await initialiseStore(user);
        setStoreInitialised(true);
      })();
    } else if (user === null && storeInitialised) {
      clearStore();
      setStoreInitialised(false);
    }
  }, [user, userInitialised, storeInitialised, setStoreInitialised]);

  return userInitialised ? (
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
  ) : authError ? (
    <ErrorPage message={authError} />
  ) : (
    <LoadingPage />
  );
};

export default App;
