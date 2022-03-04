import React from "react";
import * as EmailValidator from "email-validator";
import classnames from "classnames";
import Form from "react-bootstrap/Form";
import useForm from "common/forms/useForm";
import { Alert, Button } from "react-bootstrap";

export interface UserFormValues {
  name: string;
  email: string;
  phoneNumber: string;
  acceptsReminders: boolean;
  isAdmin: boolean;
}

const validate = (values: UserFormValues) => {
  const errors = {} as { [key: string]: any };
  const { name, email, phoneNumber, acceptsReminders } = values;

  if (name === "") {
    errors.name = `Required`;
  }

  if (email === "") {
    errors.email = `Required`;
  } else if (EmailValidator.validate(email) === false) {
    errors.email = `Must be a valid email address`;
  }

  if (acceptsReminders === true && phoneNumber === "") {
    errors.phoneNumber = `Required for reminders`;
  }

  if (phoneNumber !== "") {
    const normalisedPhoneNumber = phoneNumber
      .replace(/-/g, "")
      .replace(/ /g, "");
    if (normalisedPhoneNumber.match(/04[0-9]{8}/) === null) {
      errors.phoneNumber = `Must be a valid Australian mobile number`;
    }
  }

  return errors;
};

interface UserFormProps {
  defaultValues: UserFormValues | null;
  onSubmit: (values: UserFormValues) => void;
  pending?: boolean;
  className?: string;
}

const UserForm: React.FC<UserFormProps> = ({
  defaultValues,
  onSubmit,
  pending,
  className,
}) => {
  const isNewUser = defaultValues === null;
  const initialValues = defaultValues
    ? defaultValues
    : {
        name: "",
        email: "",
        phoneNumber: "",
        acceptsReminders: false,
        isAdmin: false,
      };

  const {
    values,
    errors,
    visibleErrors,
    handleSubmit,
    handleChange,
    handleBlur,
  } = useForm(initialValues, onSubmit, validate);

  return (
    <Form
      className={classnames("form-narrow", className)}
      onSubmit={handleSubmit}
    >
      {errors.form && <Alert variant="danger">{errors.form}</Alert>}
      <Form.Group controlId="name">
        <Form.Label>Name</Form.Label>
        <Form.Control
          autoFocus={isNewUser}
          type="text"
          name="name"
          isInvalid={visibleErrors.name}
          value={values.name}
          onBlur={handleBlur}
          onChange={handleChange}
          disabled={pending}
        />
        {visibleErrors.name && (
          <Form.Control.Feedback type="invalid">
            {errors.name}
          </Form.Control.Feedback>
        )}
      </Form.Group>
      <Form.Group controlId="email">
        <Form.Label>Email address</Form.Label>
        <Form.Control
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
      <Form.Group controlId="phoneNumber">
        <Form.Label>Phone number</Form.Label>
        <Form.Control
          type="text"
          name="phoneNumber"
          isInvalid={visibleErrors.phoneNumber}
          value={values.phoneNumber}
          onBlur={handleBlur}
          onChange={handleChange}
          disabled={pending}
        />
        {visibleErrors.phoneNumber && (
          <Form.Control.Feedback type="invalid">
            {errors.phoneNumber}
          </Form.Control.Feedback>
        )}
      </Form.Group>
      <Form.Group controlId="acceptsReminders">
        <Form.Check
          name="acceptsReminders"
          type="checkbox"
          label="Accepts SMS Reminders"
          isInvalid={visibleErrors.acceptsReminders}
          checked={values.acceptsReminders}
          onBlur={handleBlur}
          onChange={handleChange}
          disabled={pending}
        />
        {visibleErrors.acceptsReminders && (
          <Form.Control.Feedback type="invalid">
            {errors.acceptsReminders}
          </Form.Control.Feedback>
        )}
      </Form.Group>
      <Form.Group controlId="isAdmin">
        <Form.Check
          name="isAdmin"
          type="checkbox"
          label="Administrator"
          isInvalid={visibleErrors.isAdmin}
          checked={values.isAdmin}
          onBlur={handleBlur}
          onChange={handleChange}
          disabled={pending}
        />
        {visibleErrors.isAdmin && (
          <Form.Control.Feedback type="invalid">
            {errors.isAdmin}
          </Form.Control.Feedback>
        )}
      </Form.Group>
      <Button variant="primary" type="submit" disabled={pending}>
        {isNewUser
          ? pending
            ? `Creating user`
            : `Create user`
          : pending
          ? `Saving`
          : `Save`}
      </Button>
    </Form>
  );
};

export default UserForm;
