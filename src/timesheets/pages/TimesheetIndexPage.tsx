import React, { useMemo, useState, useEffect } from "react";
import PageTitle from "common/layouts/PageTitle";
import DefaultLayout from "common/layouts/DefaultLayout";
import { Link } from "react-router-dom";
import TimesheetTable from "timesheets/TimesheetTable";
import { useSelector } from "react-redux";
import {
  selectTimesheets,
  actions as timesheetActions,
} from "timesheets/store/timesheets";
import Messages from "messages/Messages";
import { Timesheet } from "timesheets/types";
import { entityStateIsIdle } from "store/entity";
import { useThunkDispatch } from "store/createStore";
import LoadingPage from "common/pages/LoadingPage";

const useTimesheets = () => {
  const dispatch = useThunkDispatch();
  const [isRefreshed, setRefreshed] = useState(false);
  const [timesheets, setTimesheets] = useState<Timesheet[] | null>(null);
  const timesheetsState = useSelector(selectTimesheets);

  useEffect(() => {
    if (entityStateIsIdle(timesheetsState)) {
      if (!isRefreshed) {
        (async () => {
          await dispatch(timesheetActions.fetchAll());
          setRefreshed(true);
        })();
      } else {
        const { entities } = timesheetsState;
        setTimesheets(entities.allIDs.map((id) => entities.byID[id]));
      }
    }
  }, [isRefreshed, timesheetsState]);

  return {
    timesheets,
    error: timesheetsState.error,
  };
};

const TimesheetIndexPage = () => {
  const { timesheets } = useTimesheets();

  if (timesheets === null) {
    return <LoadingPage />;
  }

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
        {timesheets.length > 0 ? (
          <TimesheetTable timesheets={timesheets} />
        ) : (
          <p>You don't have any timesheets, yet.</p>
        )}
      </div>
    </DefaultLayout>
  );
};

export default TimesheetIndexPage;
