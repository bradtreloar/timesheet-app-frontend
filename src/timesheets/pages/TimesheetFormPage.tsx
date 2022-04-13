import React from "react";
import { useSelector } from "react-redux";
import PageTitle from "common/layouts/PageTitle";
import TimesheetForm from "timesheets/forms/TimesheetForm";
import { useAuth } from "auth/context";
import useFormController from "common/forms/useFormController";
import DefaultLayout from "common/layouts/DefaultLayout";
import {
  selectTimesheets,
  actions as timesheetActions,
} from "timesheets/store/timesheets";
import { actions as shiftActions } from "timesheets/store/shifts";
import { actions as absenceActions } from "timesheets/store/absences";
import { useHistory } from "react-router";
import Messages from "messages/Messages";
import { Button } from "react-bootstrap";
import { useMessages } from "messages/context";
import { actions as userActions } from "users/store/users";
import { useThunkDispatch } from "store/createStore";
import {
  AbsenceAttributes,
  ShiftAttributes,
  ShiftValues,
  Timesheet,
} from "timesheets/types";
import { DateTime } from "luxon";

const TimesheetFormPage = () => {
  const dispatch = useThunkDispatch();
  const { user, logout, updateUser } = useAuth();
  const { setMessage, dismissMessagesByTag } = useMessages();
  const history = useHistory();
  const { error } = useSelector(selectTimesheets);

  if (!user) {
    throw new Error(`User is not logged in.`);
  }

  const {
    formError,
    formPending,
    handleSubmit: handleSubmitTimesheet,
  } = useFormController<{
    shiftsAttributes: ShiftAttributes[];
    absencesAttributes: AbsenceAttributes[];
    comment: string;
  }>(async ({ shiftsAttributes, absencesAttributes, comment }) => {
    const addTimesheetAction = await dispatch(
      timesheetActions.addBelongingTo({
        attributes: {
          comment,
          submitted: null,
          emailSent: null,
        },
        belongsToID: user.id,
      })
    );
    if (addTimesheetAction.type === "timesheets/addBelongingTo/rejected") {
      throw new Error(`Unable to create timesheet`);
    }
    const timesheet = addTimesheetAction.payload as Timesheet;
    for (let shiftAttributes of shiftsAttributes) {
      if (shiftActions.addBelongingTo) {
        const action = await dispatch(
          shiftActions.addBelongingTo({
            attributes: shiftAttributes,
            belongsToID: timesheet.id,
          })
        );
      }
    }
    for (let absenceAttributes of absencesAttributes) {
      if (absenceActions.addBelongingTo) {
        const action = await dispatch(
          absenceActions.addBelongingTo({
            attributes: absenceAttributes,
            belongsToID: timesheet.id,
          })
        );
      }
    }
    const updateTimesheetAction = await dispatch(
      timesheetActions.update(
        Object.assign({}, timesheet, {
          attributes: {
            comment: timesheet.attributes.comment,
            submitted: DateTime.now().toISO(),
            emailSent: null,
          },
        })
      )
    );
    if (updateTimesheetAction.type === "timesheets/update/rejected") {
      throw new Error(`Unable to create timesheet`);
    }
    setMessage(
      "success",
      <>
        <p>Your timesheet has been submitted.</p>
        <p>A copy has been emailed to you at {user?.email}</p>
        <Button
          variant="outline-dark"
          onClick={async () => {
            await logout();
            dismissMessagesByTag("timesheet-form");
          }}
        >
          Click here to log out
        </Button>
      </>,
      ["timesheet-form"]
    );
    history.push("/");
  });

  const handleSubmitDefaultShifts = async (
    defaultShiftValues: ShiftValues[]
  ) => {
    const updatedUser = Object.assign({}, user, {
      defaultShiftValues,
    });
    await updateUser(updatedUser);
    setMessage("success", "Your default shifts have been updated.", [
      "timesheet-form",
    ]);
  };

  return (
    <DefaultLayout>
      <PageTitle>New Timesheet</PageTitle>
      <Messages />
      <div className="container">
        {formError && <div className="alert alert-danger">{formError}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <TimesheetForm
          defaultShiftValues={user.defaultShiftValues}
          onSubmitTimesheet={handleSubmitTimesheet}
          onSubmitDefaultShiftValues={handleSubmitDefaultShifts}
          pending={formPending}
        />
      </div>
    </DefaultLayout>
  );
};

export default TimesheetFormPage;
