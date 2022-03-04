import React from "react";
import PageTitle from "common/layouts/PageTitle";
import DefaultLayout from "common/layouts/DefaultLayout";
import { Link } from "react-router-dom";
import UserTable from "users/UserTable";
import { useSelector } from "react-redux";
import { selectUsers } from "users/store/users";
import Messages from "messages/Messages";
import { values } from "lodash";

const UserIndexPage = () => {
  const { entities, status: userStoreStatus } = useSelector(selectUsers);

  const users = values(entities.byID);

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
        {userStoreStatus === "pending" ? (
          <p>Loading...</p>
        ) : (
          <UserTable users={users} />
        )}
      </div>
    </DefaultLayout>
  );
};

export default UserIndexPage;
