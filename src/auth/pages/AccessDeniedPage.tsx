import * as React from "react";
import PageTitle from "common/layouts/PageTitle";
import DefaultLayout from "common/layouts/DefaultLayout";
import { Link } from "react-router-dom";
import Messages from "messages/Messages";

const AccessDeniedPage = () => (
  <DefaultLayout>
    <PageTitle>403: Access Denied</PageTitle>
    <Messages />
    <div className="container">
      <p>
        You do not have permission to view this page.{" "}
        <Link to="/">Return to the home page.</Link>
      </p>
    </div>
  </DefaultLayout>
);

export default AccessDeniedPage;
