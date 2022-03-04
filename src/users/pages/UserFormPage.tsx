import React from "react";
import { useSelector } from "react-redux";
import PageTitle from "common/layouts/PageTitle";
import DefaultLayout from "common/layouts/DefaultLayout";
import useFormController from "common/forms/useFormController";
import UserForm, { UserFormValues } from "users/forms/UserForm";
import { Alert } from "react-bootstrap";
import { actions as userActions, selectUsers } from "users/store/users";
import { useHistory, useParams } from "react-router";
import NotFoundPage from "navigation/pages/NotFoundPage";
import { useMessages } from "messages/context";
import { range } from "lodash";
import Messages from "messages/Messages";
import { useThunkDispatch } from "store/createStore";
import { ShiftValues } from "timesheets/types";
import { UserAttributes } from "users/types";

const createEmptyDefaultShifts = (): ShiftValues[] =>
  range(7).map(() => ({
    isActive: false,
    reason: "rostered-day-off",
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
  const dispatch = useThunkDispatch();
  const { id } = useParams<{ id?: string }>();
  const { entities: users, error: usersStoreError } = useSelector(selectUsers);
  const { setMessage } = useMessages();
  const history = useHistory();

  const newUser = id === undefined;
  const selectedUser = newUser ? null : users.byID[id as string];

  const { formError, formPending, handleSubmit } = useFormController(
    async (values: UserFormValues) => {
      if (newUser) {
        const newUser: UserAttributes = {
          ...values,
          defaultShiftValues: createEmptyDefaultShifts(),
        };
        await dispatch(userActions.add(newUser));
        setMessage("success", `New user ${newUser.name} created.`);
        history.push("/users");
      } else {
        const updatedUser = Object.assign({}, selectedUser, values);
        await dispatch(userActions.update(updatedUser));
        setMessage("success", `User ${updatedUser.name} updated.`);
        history.push("/users");
      }
    }
  );

  if (!newUser && !selectedUser) {
    return <NotFoundPage />;
  }

  return (
    <DefaultLayout>
      <PageTitle>{newUser ? `New User` : `Edit User`}</PageTitle>
      <Messages />
      <div className="container">
        {usersStoreError && <Alert variant="danger">{usersStoreError}</Alert>}
        {formError && <Alert variant="danger">{formError}</Alert>}
        <UserForm
          defaultValues={selectedUser ? selectedUser.attributes : null}
          onSubmit={handleSubmit}
          pending={formPending}
        />
      </div>
    </DefaultLayout>
  );
};

export default UserFormPage;
