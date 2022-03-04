import React from "react";
import PageTitle from "common/layouts/PageTitle";
import { useAuth } from "auth/context";
import DefaultLayout from "common/layouts/DefaultLayout";
import useFormController from "common/forms/useFormController";
import PasswordForm from "auth/forms/PasswordForm";
import { useHistory, useParams } from "react-router";
import { useMessages } from "messages/context";
import Messages from "messages/Messages";

const PasswordResetPage = () => {
  const { email, token } = useParams<{
    email: string;
    token: string;
  }>();
  const { resetPassword } = useAuth();
  const { setMessage } = useMessages();
  const history = useHistory();

  const { formError, formPending, handleSubmit } = useFormController<{
    password: string;
  }>(async ({ password }) => {
    await resetPassword(email, token, password);
    setMessage("success", `Your password has been set. You can now log in.`, [
      "account",
    ]);
    history.push(`/login`);
  });

  return (
    <DefaultLayout>
      <PageTitle>Set New Password</PageTitle>
      <Messages />
      <div className="container">
        {formError && <div className="alert alert-danger">{formError}</div>}
        <PasswordForm onSubmit={handleSubmit} pending={formPending} />
      </div>
    </DefaultLayout>
  );
};

export default PasswordResetPage;
