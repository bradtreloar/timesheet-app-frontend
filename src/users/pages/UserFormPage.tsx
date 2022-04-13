import React, { useEffect, useMemo } from "react";
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
import { entityStateIsIdle } from "store/entity";
import LoadingPage from "common/pages/LoadingPage";

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

const useUser = (id?: string) => {
  const dispatch = useThunkDispatch();
  const usersState = useSelector(selectUsers);

  const user = useMemo(() => {
    if (id !== undefined) {
      const user = usersState.entities.byID[id];
      return user !== undefined ? user : null;
    }
    return null;
  }, [usersState]);

  useEffect(() => {
    if (entityStateIsIdle(usersState)) {
      if (id !== undefined && usersState.entities.byID[id] === undefined) {
        (async () => {
          await dispatch(userActions.fetchOne(id));
        })();
      }
    }
  }, [id, usersState]);

  return {
    user,
    error: usersState.error,
  };
};

const UserFormPage: React.FC = () => {
  const dispatch = useThunkDispatch();
  const { id } = useParams<{ id?: string }>();
  const { setMessage } = useMessages();
  const history = useHistory();
  const { user: selectedUser, error } = useUser(id);
  const newUser = id === undefined;

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

  if (error !== null) {
    if (error.name === "EntityNotFoundException") {
      return <NotFoundPage />;
    }
    if (error.name === "UnauthorizedEntityAccessException") {
      return <NotFoundPage />;
    }
  }

  if (!newUser && selectedUser === null) {
    return <LoadingPage />;
  }

  return (
    <DefaultLayout>
      <PageTitle>{newUser ? `New User` : `Edit User`}</PageTitle>
      <Messages />
      <div className="container">
        {error && <Alert variant="danger">{error}</Alert>}
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
