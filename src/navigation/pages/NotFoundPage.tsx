import * as React from "react";
import PageTitle from "common/layouts/PageTitle";

import DefaultLayout from "common/layouts/DefaultLayout";

const NotFoundPage = () => (
  <DefaultLayout>
    <PageTitle>404: Page not found</PageTitle>
    <div className="container">
      <p data-testid="not-found-message">
        The page you are looking for does not exist.{" "}
        <a href="/">Return to the home page.</a>
      </p>
    </div>
  </DefaultLayout>
);

export default NotFoundPage;
