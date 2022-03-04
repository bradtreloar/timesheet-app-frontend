import React from "react";
import classnames from "classnames";
import * as EmailValidator from "email-validator";
import useForm from "common/forms/useForm";
import { Alert, Button, Form } from "react-bootstrap";

export type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

const validate = (values: any) => {
  const errors = {} as { [key: string]: string };
  const { email, password } = values;

  if (email === "") {
    errors.email = `Required`;
  } else if (EmailValidator.validate(email) === false) {
    errors.email = `Must be a valid email address`;
  }

  if (password === "") {
    errors.password = `Required`;
  }

  return errors;
};

const initialValues: LoginFormValues = {
  email: "",
  password: "",
  remember: false,
};

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void;
  className?: string;
  pending?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  pending,
  className,
}) => {
  const {
    values,
    errors,
    visibleErrors,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(initialValues, onSubmit, validate);

  return (
    <Form
      className={classnames("form-narrow", className)}
      onSubmit={handleSubmit}
    >
      {errors.form && <Alert variant="danger">{errors.form}</Alert>}
      <Form.Group controlId="email">
        <Form.Label>Email Address</Form.Label>
        <Form.Control
          autoFocus
          type="email"
          name="email"
          isInvalid={visibleErrors.email}
          value={values.email}
          onBlur={handleBlur}
          onChange={handleChange}
          disabled={pending}
        />
        {visibleErrors.email && (
          <Form.Control.Feedback type="invalid">
            {errors.email}
          </Form.Control.Feedback>
        )}
      </Form.Group>
      <Form.Group controlId="password">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          name="password"
          isInvalid={visibleErrors.password}
          value={values.password}
          onBlur={handleBlur}
          onChange={handleChange}
          disabled={pending}
        />
        {visibleErrors.password && (
          <Form.Control.Feedback type="invalid">
            {errors.password}
          </Form.Control.Feedback>
        )}
      </Form.Group>
      <Form.Group controlId="remember">
        <Form.Check
          type="checkbox"
          name="remember"
          label="Remember me"
          checked={values.remember}
          onBlur={handleBlur}
          onChange={handleChange}
        />
      </Form.Group>
      <Button
        variant="primary"
        type="submit"
        data-testid="login-form-submit"
        disabled={pending}
      >
        {pending ? `Logging in` : `Log in`}
      </Button>
    </Form>
  );
};

export default LoginForm;
