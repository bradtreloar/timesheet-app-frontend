import React from "react";
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

const UserDeletePage = () => {
  const dispatch = useThunkDispatch();
  const { id } = useParams<{ id?: string }>();
  const { entities } = useSelector(selectUsers);
  const history = useHistory();
  const { setMessage } = useMessages();

  const user = id !== undefined ? entities.byID[id] : undefined;

  if (user === undefined) {
    return <NotFoundPage />;
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
