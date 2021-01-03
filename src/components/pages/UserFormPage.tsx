import React from "react";
import { useSelector } from "react-redux";
import PageTitle from "components/PageTitle";
import DefaultLayout from "components/layouts/DefaultLayout";
import useFormController from "hooks/useFormController";
import UserForm, { UserFormValues } from "components/forms/UserForm";
import { Alert } from "react-bootstrap";
import { addUser, selectUsers, updateUser } from "store/users";
import { useHistory, useParams } from "react-router";
import NotFoundPage from "./NotFoundPage";
import { useMessages } from "context/messages";
import store from "store";
import { ShiftTimes, User } from "types";
import { range } from "lodash";

const createEmptyDefaultShifts = (): ShiftTimes[] =>
  range(7).map(() => ({
    isActive: false,
    startTime: {
      hour: "",
      minute: "",
    },
    endTime: {
      hour: "",
      minute: "",
    },
    breakDuration: {
      hour: "",
      minute: "",
    },
  }));

const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { users, error: usersStoreError } = useSelector(selectUsers);
  const { setMessage } = useMessages();
  const history = useHistory();

  const newUser = id === undefined;
  const selectedUser = newUser ? null : users.find((user) => user.id === id);

  const { formError, formPending, handleSubmit } = useFormController(
    async (values: UserFormValues) => {
      if (newUser) {
        const newUser: User = {
          ...values,
          defaultShifts: createEmptyDefaultShifts(),
        };
        await store.dispatch(addUser(newUser));
        history.push("/users");
        setMessage("success", `New user ${newUser.name} created.`);
      } else {
        const updatedUser = Object.assign({}, selectedUser, values);
        await store.dispatch(updateUser(updatedUser));
        setMessage("success", `User ${updatedUser.name} updated.`);
      }
    }
  );

  if (!newUser && !selectedUser) {
    return <NotFoundPage />;
  }

  return (
    <DefaultLayout>
      <PageTitle>{newUser ? `New User` : `Edit User`}</PageTitle>
      <div className="container">
        {usersStoreError && <Alert variant="danger">{usersStoreError}</Alert>}
        {formError && <Alert variant="danger">{formError}</Alert>}
        <UserForm
          defaultValues={
            selectedUser
              ? {
                  name: selectedUser.name,
                  email: selectedUser.email,
                  isAdmin: selectedUser.isAdmin,
                }
              : null
          }
          onSubmit={handleSubmit}
          pending={formPending}
        />
      </div>
    </DefaultLayout>
  );
};

export default UserFormPage;
