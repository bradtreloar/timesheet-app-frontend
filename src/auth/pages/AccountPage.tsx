import React from "react";
import { Link } from "react-router-dom";
import { Alert } from "react-bootstrap";
import PageTitle from "common/layouts/PageTitle";
import DefaultLayout from "common/layouts/DefaultLayout";
import useFormController from "common/forms/useFormController";
import { actions as userActions } from "users/store/users";
import NotFoundPage from "navigation/pages/NotFoundPage";
import { useMessages } from "messages/context";
import { useAuth } from "auth/context";
import AccountForm, { AccountFormValues } from "auth/forms/AccountForm";
import Messages from "messages/Messages";
import { useThunkDispatch } from "store/createStore";

const AccountPage: React.FC = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const { setMessage } = useMessages();

  const { formError, formPending, handleSubmit } = useFormController(
    async (values: AccountFormValues) => {
      const updatedUser = Object.assign({}, user, values);
      await updateUser(updatedUser);
      setMessage("success", `Account settings updated.`, ["account"]);
    },
    {
      unmountsOnSubmit: false,
    }
  );

  if (!user) {
    return <NotFoundPage />;
  }

  return (
    <DefaultLayout>
      <PageTitle>Account Settings</PageTitle>
      <Messages />
      <div className="container">
        {formError && <Alert variant="danger">{formError}</Alert>}
        <AccountForm
          defaultValues={{
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            acceptsReminders: user.acceptsReminders,
          }}
          onSubmit={handleSubmit}
          pending={formPending}
        />
        <div className="my-3">
          <Link to="/account/password">Change password</Link>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default AccountPage;
