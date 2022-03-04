import React from "react";
import PageTitle from "common/layouts/PageTitle";
import { useAuth } from "auth/context";
import DefaultLayout from "common/layouts/DefaultLayout";
import useFormController from "common/forms/useFormController";
import PasswordForm from "auth/forms/PasswordForm";
import { useHistory } from "react-router";
import { useMessages } from "messages/context";
import Messages from "messages/Messages";

const PasswordPage = () => {
  const { setPassword } = useAuth();
  const { setMessage } = useMessages();
  const history = useHistory();

  const { formError, formPending, handleSubmit } = useFormController<{
    password: string;
  }>(async ({ password }) => {
    await setPassword(password);
    setMessage("success", `Password changed.`, ["account"]);
    history.push(`/account`);
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

export default PasswordPage;
