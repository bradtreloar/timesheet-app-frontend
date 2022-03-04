import React from "react";
import PageTitle from "common/layouts/PageTitle";
import { useAuth } from "auth/context";
import DefaultLayout from "common/layouts/DefaultLayout";
import useFormController from "common/forms/useFormController";
import ForgotPasswordForm from "auth/forms/ForgotPasswordForm";
import { useHistory } from "react-router";
import { useMessages } from "messages/context";

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const { setMessage } = useMessages();
  const history = useHistory();

  const { formError, formPending, handleSubmit } = useFormController<{
    email: string;
  }>(async ({ email }) => {
    await forgotPassword(email);
    setMessage(
      "success",
      `A password reset link has been sent to ${email}.
      Read the email for instructions on how to reset your password`
    );
    history.push("/");
  });

  return (
    <DefaultLayout>
      <PageTitle>Reset Password</PageTitle>
      <div className="container">
        {formError && <div className="alert alert-danger">{formError}</div>}
        <ForgotPasswordForm pending={formPending} onSubmit={handleSubmit} />
      </div>
    </DefaultLayout>
  );
};

export default ForgotPasswordPage;
