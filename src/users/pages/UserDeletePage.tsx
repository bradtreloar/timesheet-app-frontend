import React, { useEffect, useMemo } from "react";
import PageTitle from "common/layouts/PageTitle";
import { Button } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { actions as userActions, selectUsers } from "users/store/users";
import DefaultLayout from "common/layouts/DefaultLayout";
import { useMessages } from "messages/context";
import Messages from "messages/Messages";
import { useThunkDispatch } from "store/createStore";
import NotFoundPage from "navigation/pages/NotFoundPage";
import LoadingPage from "common/pages/LoadingPage";
import { entityStateIsIdle } from "store/entity";

const useUser = (id: string) => {
  const dispatch = useThunkDispatch();
  const usersState = useSelector(selectUsers);

  const user = useMemo(() => {
    const user = usersState.entities.byID[id];
    return user !== undefined ? user : null;
  }, [usersState]);

  useEffect(() => {
    if (entityStateIsIdle(usersState)) {
      if (usersState.entities.byID[id] === undefined) {
        (async () => {
          await dispatch(userActions.fetchOne(id));
        })();
      }
    }
  }, [usersState]);

  return {
    user,
    error: usersState.error,
  };
};

const UserDeletePage = () => {
  const dispatch = useThunkDispatch();
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { setMessage } = useMessages();
  const { user, error } = useUser(id);

  if (error !== null) {
    if (error.name === "EntityNotFoundException") {
      return <NotFoundPage />;
    }
    if (error.name === "UnauthorizedEntityAccessException") {
      return <NotFoundPage />;
    }
  }

  if (user === null) {
    return <LoadingPage />;
  }

  const handleDeleteUser = async () => {
    await dispatch(userActions.delete(user));
    setMessage("success", `User ${user?.attributes.name} deleted`);
    history.push("/users");
  };

  const handleCancel = async () => {
    history.push("/users");
  };

  return (
    <DefaultLayout>
      <PageTitle>Delete User</PageTitle>
      <Messages />
      <div className="container">
        <p>{`Delete ${user.attributes.name}?`}</p>
        <div>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete User
          </Button>
          <Button variant="outline-secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default UserDeletePage;
