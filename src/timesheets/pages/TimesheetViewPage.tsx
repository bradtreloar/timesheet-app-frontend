import React, { useMemo, useState, useEffect } from "react";
import DefaultLayout from "common/layouts/DefaultLayout";
import Messages from "messages/Messages";
import PageTitle from "common/layouts/PageTitle";
import TimesheetView from "timesheets/TimesheetView";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import {
  selectTimesheets,
  actions as timesheetActions,
  UndefinedEntryException,
} from "timesheets/store/timesheets";
import { selectShifts, actions as shiftActions } from "timesheets/store/shifts";
import {
  selectAbsences,
  actions as absenceActions,
} from "timesheets/store/absences";
import NotFoundPage from "navigation/pages/NotFoundPage";
import { Absence, Entry, Shift, Timesheet } from "timesheets/types";
import { useThunkDispatch } from "store/createStore";
import { EntityState } from "store/types";
import {
  isMissingAbsences,
  isMissingShifts,
  getTimesheetEntries,
} from "timesheets/helpers";
import LoadingPage from "common/pages/LoadingPage";
import { entityStateIsIdle } from "store/entity";

const useTimesheet = (id: string) => {
  const dispatch = useThunkDispatch();
  const timesheetsState = useSelector(selectTimesheets);
  const shiftsState = useSelector(selectShifts);
  const absencesState = useSelector(selectAbsences);
  const timesheet = useMemo(() => {
    const timesheet = timesheetsState.entities.byID[id];
    return timesheet !== undefined ? timesheet : null;
  }, [timesheetsState]);

  useEffect(() => {
    if (entityStateIsIdle(timesheetsState)) {
      if (timesheetsState.entities.byID[id] === undefined) {
        (async () => {
          await dispatch(timesheetActions.fetchOne(id));
        })();
      }
    }
  }, [timesheetsState]);

  const entries = useMemo(() => {
    if (timesheet !== null) {
      const isMissingEntries =
        isMissingShifts(timesheet, shiftsState) ||
        isMissingAbsences(timesheet, absencesState);
      if (!isMissingEntries) {
        return getTimesheetEntries(timesheet, shiftsState, absencesState);
      }
    }
    return null;
  }, [timesheet, shiftsState, absencesState]);

  useEffect(() => {
    if (entityStateIsIdle(shiftsState)) {
      if (timesheet !== null && isMissingShifts(timesheet, shiftsState)) {
        (async () => {
          await dispatch(shiftActions.fetchAllBelongingTo(timesheet.id));
        })();
      }
    }
  }, [timesheet, shiftsState]);

  useEffect(() => {
    if (entityStateIsIdle(absencesState)) {
      if (timesheet !== null && isMissingAbsences(timesheet, absencesState)) {
        (async () => {
          await dispatch(absenceActions.fetchAllBelongingTo(timesheet.id));
        })();
      }
    }
  }, [timesheet, absencesState]);

  return {
    timesheet,
    entries,
    error: timesheetsState.error,
  };
};

const TimesheetViewPage: React.FC = () => {
  const dispatch = useThunkDispatch();
  const { id } = useParams<{
    id: string;
  }>();
  const { timesheet, entries, error } = useTimesheet(id);

  if (error !== null) {
    if (error.name === "EntityNotFoundException") {
      return <NotFoundPage />;
    }
    if (error.name === "UnauthorizedEntityRequestException") {
      return <NotFoundPage />;
    }
  }

  if (timesheet === null || entries === null) {
    return <LoadingPage />;
  }

  return (
    <DefaultLayout>
      <PageTitle>Timesheet Details</PageTitle>
      <Messages />
      <div className="container">
        <TimesheetView timesheet={timesheet} entries={entries} />
      </div>
    </DefaultLayout>
  );
};

export default TimesheetViewPage;
