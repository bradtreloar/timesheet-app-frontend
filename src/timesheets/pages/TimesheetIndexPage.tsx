import React, { useMemo } from "react";
import PageTitle from "common/layouts/PageTitle";
import DefaultLayout from "common/layouts/DefaultLayout";
import { Link } from "react-router-dom";
import TimesheetTable from "timesheets/TimesheetTable";
import { useSelector } from "react-redux";
import { selectTimesheets } from "timesheets/store/timesheets";
import Messages from "messages/Messages";
import { values } from "lodash";

const TimesheetIndexPage = () => {
  const { entities, status: timesheetStoreStatus } = useSelector(
    selectTimesheets
  );

  const timesheets = useMemo(() => values(entities.byID), [entities]);

  return (
    <DefaultLayout>
      <PageTitle>Timesheets</PageTitle>
      <Messages />
      <div className="container">
        <div className="my-3">
          <Link className="btn btn-primary" to="/timesheet/new">
            Create new timesheet
          </Link>
        </div>
        {timesheetStoreStatus === "pending" ? (
          <p>Loading...</p>
        ) : timesheets.length > 0 ? (
          <TimesheetTable timesheets={timesheets} />
        ) : (
          <p>You don't have any timesheets, yet.</p>
        )}
      </div>
    </DefaultLayout>
  );
};

export default TimesheetIndexPage;
