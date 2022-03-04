import DefaultLayout from "common/layouts/DefaultLayout";
import Messages from "messages/Messages";
import PageTitle from "common/layouts/PageTitle";
import TimesheetView from "timesheets/TimesheetView";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { selectTimesheets } from "timesheets/store/timesheets";
import NotFoundPage from "navigation/pages/NotFoundPage";
import { selectShifts } from "timesheets/store/shifts";

const TimesheetViewPage: React.FC = () => {
  const { id } = useParams<{
    id: string;
  }>();
  const { entities: timesheets } = useSelector(selectTimesheets);
  const { entities: shiftEntities } = useSelector(selectShifts);
  const timesheet = timesheets.byID[id];
  const shifts = useMemo(
    () =>
      timesheet.relationships.shifts.map(
        (shiftID) => shiftEntities.byID[shiftID]
      ),
    [timesheet, shiftEntities]
  );

  return timesheet ? (
    <DefaultLayout>
      <PageTitle>Timesheet Details</PageTitle>
      <Messages />
      <div className="container">
        <TimesheetView timesheet={timesheet} entries={shifts} />
      </div>
    </DefaultLayout>
  ) : (
    <NotFoundPage />
  );
};

export default TimesheetViewPage;
