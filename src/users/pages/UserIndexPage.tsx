import React, { useEffect, useState } from "react";
import PageTitle from "common/layouts/PageTitle";
import DefaultLayout from "common/layouts/DefaultLayout";
import { Link } from "react-router-dom";
import UserTable from "users/UserTable";
import { useSelector } from "react-redux";
import { selectUsers, actions as userActions } from "users/store/users";
import Messages from "messages/Messages";
import { values } from "lodash";
import { useThunkDispatch } from "store/createStore";
import { User } from "users/types";
import { entityStateIsIdle } from "store/entity";
import LoadingPage from "common/pages/LoadingPage";

const useUsers = () => {
  const dispatch = useThunkDispatch();
  const [isRefreshed, setRefreshed] = useState(false);
  const [users, setUsers] = useState<User[] | null>(null);
  const usersState = useSelector(selectUsers);

  useEffect(() => {
    if (entityStateIsIdle(usersState)) {
      if (!isRefreshed) {
        (async () => {
          await dispatch(userActions.fetchAll());
          setRefreshed(true);
        })();
      } else {
        const { entities } = usersState;
        setUsers(entities.allIDs.map((id) => entities.byID[id]));
      }
    }
  }, [isRefreshed, usersState]);

  return {
    users,
    error: usersState.error,
  };
};

const UserIndexPage = () => {
  const { users } = useUsers();

  if (users === null) {
    return <LoadingPage />;
  }

  return (
    <DefaultLayout>
      <PageTitle>Manage Users</PageTitle>
      <Messages />
      <div className="container">
        <div className="my-3">
          <Link className="btn btn-primary" to="/users/new">
            Create new user
          </Link>
        </div>
        <UserTable users={users} />
      </div>
    </DefaultLayout>
  );
};

export default UserIndexPage;
