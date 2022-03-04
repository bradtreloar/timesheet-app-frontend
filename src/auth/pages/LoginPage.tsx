import React from "react";
import { Link } from "react-router-dom";
import LoginForm, { LoginFormValues } from "auth/forms/LoginForm";
import Messages from "messages/Messages";
import PageTitle from "common/layouts/PageTitle";
import { useAuth } from "auth/context";
import DefaultLayout from "common/layouts/DefaultLayout";
import useFormController from "common/forms/useFormController";

const LoginPage = () => {
  const { login } = useAuth();

  const {
    formError,
    formPending,
    handleSubmit,
  } = useFormController<LoginFormValues>(({ email, password, remember }) =>
    login(email, password, remember)
  );

  return (
    <DefaultLayout>
      <PageTitle>Log in</PageTitle>
      <Messages />
      <div className="container">
        {formError && <div className="alert alert-danger">{formError}</div>}
        <LoginForm onSubmit={handleSubmit} pending={formPending} />
        <div className="my-3">
          <Link to="forgot-password">
            Forgot your password? Click here to reset it.
          </Link>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default LoginPage;
