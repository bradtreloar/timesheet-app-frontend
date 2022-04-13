import React, {
  createRef,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isEmpty, range } from "lodash";
import classnames from "classnames";
import { InvalidTimeException, Time } from "utils/date";
import useForm, { FormErrors } from "common/forms/useForm";
import WeekSelect from "timesheets/inputs/WeekSelect";
import TimeInput from "timesheets/inputs/TimeInput";
import { DateTime } from "luxon";
import "./TimesheetForm.scss";
import { Button, Form } from "react-bootstrap";
import { getShiftHoursFromTimes } from "timesheets/helpers";
import {
  AbsenceAttributes,
  ShiftAttributes,
  ShiftValues,
} from "timesheets/types";

export const shiftTimesNames = [
  "startTime",
  "endTime",
  "breakDuration",
] as const;

export const shiftTimesInputNames = shiftTimesNames.reduce((names, name) => {
  names.push(`${name}.hour`);
  names.push(`${name}.minute`);
  return names;
}, [] as string[]);

export const reasons = {
  none: "Select a reason",
  "absent:sick-day": "Absent: sick day",
  "absent:not-sick-day": "Absent: not sick day",
  "annual-leave": "Annual leave",
  "long-service": "Long service leave",
  "unpaid-leave": "Unpaid leave",
  "public-holiday": "Public Holiday",
  "rostered-day-off": "Rostered day off",
} as const;

const getShiftValuesFromFormValues = (values: any, index: number) => {
  return {
    isActive: values[`shift.${index}.isActive`],
    reason: values[`shift.${index}.reason`],
    ...shiftTimesNames.reduce((times, name) => {
      times[name] = {
        hour: values[`shift.${index}.${name}.hour`],
        minute: values[`shift.${index}.${name}.minute`],
      };
      return times;
    }, {} as any),
  } as ShiftValues;
};

/**
 * Prepares the values for the form's initial state.
 *
 * @param defaultShiftValues
 *   The start time, end time, and break duration for each shift, or null for
 *   each shift that is disabled by default.
 * @returns
 *   An object containing the default value for each form input.
 */
const buildInitialValues = (defaultShiftValues: ShiftValues[]) => {
  const weekStartDateTime =
    DateTime.now().weekday === 1
      ? DateTime.now().startOf("week").minus({ weeks: 1 })
      : DateTime.now().startOf("week");

  return {
    weekStartDateTime,
    comment: "",
    ...range(7).reduce((values, index) => {
      const dv = defaultShiftValues[index];
      const name = `shift.${index}`;
      values[`${name}.isActive`] = dv.isActive;
      values[`${name}.reason`] = dv.reason;
      shiftTimesNames.forEach((shiftTimesName) => {
        values[`${name}.${shiftTimesName}.hour`] = dv[
          shiftTimesName
        ].hour.toString();
        values[`${name}.${shiftTimesName}.minute`] = dv[
          shiftTimesName
        ].minute.toString();
      });
      return values;
    }, {} as any),
  };
};

/**
 * Processes form values into an array of ShiftValues objects
 *
 * @param values
 *   An object containing the value for each form input.
 * @returns
 *   A array of ShiftValues objects.
 */
const processShiftValues = (values: any): ShiftValues[] =>
  range(7).map((index) => getShiftValuesFromFormValues(values, index));

/**
 * Prepares the value to be passed to the form's onSubmitTimesheet callback.
 *
 * @param values
 *   An object containing the value for each form input.
 * @returns
 *   A array of Shift objects.
 */
export const processTimesheet = (
  values: any
): {
  shiftsAttributes: ShiftAttributes[];
  absencesAttributes: AbsenceAttributes[];
  comment: string;
} => {
  const weekStartDateTime = values.weekStartDateTime as DateTime;
  const comment = values.comment;
  const allShiftValues = processShiftValues(values);
  const shiftsAttributes: ShiftAttributes[] = [];
  const absencesAttributes: AbsenceAttributes[] = [];
  allShiftValues.forEach((shiftValues, index) => {
    const shiftDate = weekStartDateTime.plus({ days: index });
    if (shiftValues.isActive) {
      const shiftAttributes: ShiftAttributes = {
        start: shiftDate
          .set({
            hour: parseInt(shiftValues.startTime.hour),
            minute: parseInt(shiftValues.startTime.minute),
          })
          .toISO(),
        end: shiftDate
          .set({
            hour: parseInt(shiftValues.endTime.hour),
            minute: parseInt(shiftValues.endTime.minute),
          })
          .toISO(),
        breakDuration: new Time(
          shiftValues.breakDuration.hour,
          shiftValues.breakDuration.minute
        ).toMinutes(),
      };
      shiftsAttributes.push(shiftAttributes);
    } else {
      const absenceAttributes: AbsenceAttributes = {
        date: shiftDate.toISO(),
        reason: shiftValues.reason,
      };
      absencesAttributes.push(absenceAttributes);
    }
  });

  return { shiftsAttributes, absencesAttributes, comment };
};

/**
 * Validates the shift times inputs.
 *
 * @param values
 *   An object containing the value for each form input.
 * @returns
 *   An object containing the error for any form inputs that contain invalid
 *   values. Returns null if no errors are found.
 */
const validateShiftValues = (values: any) => {
  const errors = {} as FormErrors<any>;

  range(7).forEach((index) => {
    // Don't validate a shift's values while it is disabled.
    if (values[`shift.${index}.isActive`] === true) {
      shiftTimesNames.forEach((name) => {
        const prefix = `shift.${index}.${name}`;
        const hour = values[`${prefix}.hour`];
        const minute = values[`${prefix}.minute`];

        if (hour === "") {
          errors[`${prefix}.hour`] = `Hour required`;
        } else {
          const hourInt = parseInt(hour);
          if (isNaN(hourInt) || hourInt < 0 || hourInt >= 24) {
            errors[`${prefix}.hour`] = `Hour must be a number between 0 and 23`;
          }
        }

        if (minute === "") {
          errors[`${prefix}.minute`] = `Minute required`;
        } else {
          const minuteInt = parseInt(minute);
          if (isNaN(minuteInt) || minuteInt < 0 || minuteInt >= 60) {
            errors[
              `${prefix}.hour`
            ] = `Minutes must be a number between 0 and 59`;
          }
        }
      });
    } else {
      if (values[`shift.${index}.reason`] === "none") {
        errors[`shift.${index}.reason`] = `Reason required`;
      }
    }
  });

  if (isEmpty(errors)) {
    range(7).forEach((index) => {
      const shiftValues = getShiftValuesFromFormValues(values, index);
      if (shiftValues.isActive) {
        const startTime = Time.fromObject(shiftValues.startTime);
        const endTime = Time.fromObject(shiftValues.endTime);
        const breakDuration = Time.fromObject(shiftValues.breakDuration);

        if (endTime.toMinutes() <= startTime.toMinutes()) {
          errors[`shift.${index}.endTime`] = `Must be later than start`;
        } else if (
          endTime.toMinutes() -
            startTime.toMinutes() -
            breakDuration.toMinutes() <=
          0
        ) {
          errors[
            `shift.${index}.breakDuration`
          ] = `Must be less than total shift`;
        }
      }
    });
  }

  return errors;
};

/**
 * Validates the form inputs.
 *
 * @param values
 *   An object containing the value for each form input.
 * @returns
 *   An object containing the error for any form inputs that contain invalid
 *   values. Returns null if no errors are found.
 */
const validateTimesheet = (values: any) => {
  const errors = validateShiftValues(values);

  if (values.comment.length > 255) {
    errors[`comment`] = `Must be no longer than 255 characters`;
  }

  return errors;
};

export interface TimesheetFormProps {
  defaultShiftValues: ShiftValues[];
  onSubmitTimesheet: (values: {
    shiftsAttributes: ShiftAttributes[];
    absencesAttributes: AbsenceAttributes[];
    comment: string;
  }) => void;
  onSubmitDefaultShiftValues: (shifts: ShiftValues[]) => void;
  pending?: boolean;
  className?: string;
}

const TimesheetForm: React.FC<TimesheetFormProps> = ({
  defaultShiftValues,
  onSubmitTimesheet,
  onSubmitDefaultShiftValues,
  pending,
  className,
}) => {
  const initialValues = useCallback(
    () => buildInitialValues(defaultShiftValues),
    [defaultShiftValues]
  );

  const {
    values,
    setSomeValues,
    setSomeTouchedValues,
    errors,
    focusedInput,
    handleChange,
    handleFocus,
    handleBlur,
    handleSubmit: handleSubmitTimesheet,
    handleReset,
    setFocusedInput,
    visibleErrors,
  } = useForm(
    initialValues,
    (values) => {
      onSubmitTimesheet(processTimesheet(values));
    },
    validateTimesheet
  );

  const inputRefs = useMemo(
    () =>
      range(7).reduce(
        (refs, index) => {
          refs[`shift.${index}.startTime`] = {
            hour: createRef<HTMLInputElement>(),
            minute: createRef<HTMLInputElement>(),
          };
          refs[`shift.${index}.endTime`] = {
            hour: createRef<HTMLInputElement>(),
            minute: createRef<HTMLInputElement>(),
          };
          refs[`shift.${index}.breakDuration`] = {
            hour: createRef<HTMLInputElement>(),
            minute: createRef<HTMLInputElement>(),
          };
          return refs;
        },
        {} as {
          [key: string]: {
            hour: RefObject<HTMLInputElement>;
            minute: RefObject<HTMLInputElement>;
          };
        }
      ),
    []
  );

  const [
    selectedInput,
    setSelectedInput,
  ] = useState<RefObject<HTMLInputElement> | null>(
    inputRefs[`shift.0.startTime`].hour
  );

  useEffect(() => {
    if (selectedInput) {
      selectedInput.current?.select();
    }
  }, [selectedInput]);

  const defaultShiftValuesErrors = useMemo(() => validateShiftValues(values), [
    values,
  ]);

  const handleSubmitDefaultShifts = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    event.preventDefault();
    const errors = validateShiftValues(values);
    if (isEmpty(errors)) {
      onSubmitDefaultShiftValues(processShiftValues(values));
    }
  };

  const handleShiftToggle = (
    name: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isActive = event.target.checked;
    const newValues = {} as { [key: string]: string | boolean };
    const newTouchedValues = {} as { [key: string]: false };
    newValues[`${name}.isActive`] = isActive;
    if (isActive) {
      // Focus on the start time hour input.
      setSelectedInput(inputRefs[`${name}.startTime`].hour);
    } else {
      // Clear the reason.
      newValues[`${name}.reason`] = "none";
      // Clear the time values for the shift and flag the time inputs
      // as untouched.
      shiftTimesInputNames.forEach((inputName) => {
        newValues[`${name}.${inputName}`] = "";
        newTouchedValues[`${name}.${inputName}`] = false;
      });
      setSelectedInput(null);
    }
    setSomeValues(newValues);
    setSomeTouchedValues(newTouchedValues);
  };

  const allShiftValues = range(7).map((index) =>
    getShiftValuesFromFormValues(values, index)
  );

  const allShiftHours = allShiftValues.map((shiftValues) => {
    try {
      return getShiftHoursFromTimes(shiftValues);
    } catch (error) {
      if (!(error instanceof InvalidTimeException)) {
        throw error;
      }
    }
    return null;
  });

  const timesheetTotalWeekdayHours = allShiftHours.reduce(
    (totalHours: number, shiftHours, index) =>
      shiftHours && index < 5 ? totalHours + shiftHours : totalHours,
    0
  );

  const timeField = (name: string, label: string) => {
    const visibleHourError = visibleErrors[`${name}.hour`];
    const visibleMinuteError = visibleErrors[`${name}.minute`];
    const hasFocus =
      focusedInput === `${name}.hour` || focusedInput === `${name}.minute`;

    return (
      <TimeField
        name={name}
        label={label}
        hour={values[`${name}.hour`]}
        minute={values[`${name}.minute`]}
        timeError={errors[`${name}`]}
        hourError={errors[`${name}.hour`]}
        minuteError={errors[`${name}.minute`]}
        visibleHourError={visibleHourError}
        visibleMinuteError={visibleMinuteError}
        visibleError={visibleHourError || visibleMinuteError}
        hasFocus={hasFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={pending}
        refs={inputRefs[name]}
      />
    );
  };

  const shiftInput = (index: number) => {
    const name = `shift.${index}`;
    const shiftDate = values.weekStartDateTime.plus({ days: index });
    const shiftValues = allShiftValues[index];
    const shiftHours = allShiftHours[index];
    const label = shiftDate.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
    const isActive = shiftValues.isActive;
    const reason = shiftValues.reason;

    return (
      <div
        key={index}
        className={classnames(
          "shift-input border p-1 my-1 bg-light",
          isActive
            ? "border-primary"
            : reason !== "rostered-day-off" &&
                reason !== "none" &&
                "border-primary"
        )}
      >
        <div className="d-lg-flex" aria-label="Shift">
          <label className="d-flex align-items-center m-0 flex-grow-1 pl-2 py-1 py-lg-2 mr-lg-3">
            <input
              data-testid={`shift-${index}-toggle`}
              name={`${name}.isActive`}
              type="checkbox"
              checked={isActive}
              onChange={(event) => handleShiftToggle(name, event)}
              onKeyPress={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                }
              }}
            />
            <span className="ml-3">{label}</span>
          </label>
          {isActive ? (
            <div className="d-md-flex align-items-center mt-1 mt-lg-0">
              {timeField(`${name}.startTime`, "Start")}
              {timeField(`${name}.endTime`, "End")}
              {timeField(`${name}.breakDuration`, "Break")}
              <div className="shift-hours">
                <div className="form-control w-100 text-right">
                  {shiftHours ? `${shiftHours} hours` : `\u00A0`}
                </div>
              </div>
            </div>
          ) : (
            <div className="d-md-flex align-items-center mt-1 mt-lg-0">
              <Form.Control
                isInvalid={visibleErrors[`${name}.reason`]}
                aria-label="reason"
                data-testid={`shift-${index}-reason`}
                as="select"
                name={`${name}.reason`}
                value={reason}
                onChange={handleChange}
              >
                {Object.keys(reasons).map((name) => (
                  <option key={name} value={name}>
                    {reasons[name as keyof typeof reasons]}
                  </option>
                ))}
              </Form.Control>
              {visibleErrors[`${name}.reason`] && (
                <div className="sr-only">
                  <Form.Control.Feedback type="invalid">
                    {errors[`${name}.reason`]}
                  </Form.Control.Feedback>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const weekdayShiftInputs = range(0, 5).map((index) => shiftInput(index));
  const weekendShiftInputs = range(5, 7).map((index) => shiftInput(index));

  return (
    <form
      onSubmit={handleSubmitTimesheet}
      onReset={handleReset}
      className={className}
    >
      {errors.form && <div className="alert alert-danger">{errors.form}</div>}
      <div className="my-3">
        <WeekSelect
          className="w-100"
          value={values.weekStartDateTime}
          onChange={(value) => {
            handleChange({
              target: {
                type: "weekSelect",
                name: "weekStartDateTime",
                value,
              },
            });
          }}
          disabled={pending}
        />
      </div>
      <div>
        {weekdayShiftInputs}
        <div className="border p-1 my-1 bg-light">
          <div
            aria-label="Total"
            className="d-flex w-100 align-items-center mt-1 mt-lg-0"
          >
            <div className="mx-2 text-right flex-grow-1">Weekday Hours</div>
            <div className="timesheet-total-hours">
              <div className="form-control w-100 text-right">
                {timesheetTotalWeekdayHours
                  ? `${timesheetTotalWeekdayHours} hours`
                  : `\u00A0`}
              </div>
            </div>
          </div>
        </div>
        {weekendShiftInputs}
      </div>
      <Form.Group controlId="comment" className="my-3">
        <Form.Label>Comments/Notes</Form.Label>
        <Form.Control
          name="comment"
          onChange={handleChange}
          disabled={pending}
        />
      </Form.Group>
      <div className="my-3 d-md-flex flex-row-reverse justify-content-between align-items-center">
        <div className="d-md-flex flex-row-reverse align-items-center">
          <Button
            className="mb-3"
            variant="success"
            size="lg"
            type="submit"
            disabled={pending}
          >
            {pending ? `Submitting timesheet` : `Submit timesheet`}
          </Button>
          &nbsp;
          <Button
            className="mb-3"
            variant="outline-secondary"
            size="lg"
            type="reset"
            disabled={pending}
          >
            Reset form
          </Button>
        </div>
        {isEmpty(defaultShiftValuesErrors) && (
          <div>
            <Button
              variant="light"
              type="button"
              onClick={handleSubmitDefaultShifts}
            >
              Save these shifts as my default
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};

interface TimeFieldProps {
  name: string;
  label: string;
  hour: string;
  minute: string;
  timeError: string;
  hourError: string;
  minuteError: string;
  visibleHourError?: boolean;
  visibleMinuteError?: boolean;
  visibleError?: boolean;
  hasFocus: boolean;
  onFocus: (event: any) => void;
  onBlur: (event: any) => void;
  onChange: (event: any) => void;
  disabled?: boolean;
  refs: {
    hour: RefObject<HTMLInputElement>;
    minute: RefObject<HTMLInputElement>;
  };
}

const TimeField: React.FC<TimeFieldProps> = ({
  name,
  label,
  hour,
  minute,
  timeError,
  hourError,
  minuteError,
  visibleHourError,
  visibleMinuteError,
  visibleError,
  hasFocus,
  onFocus,
  onBlur,
  onChange,
  disabled,
  refs,
}) => {
  return (
    <div className="mr-md-3 mb-2 mb-md-0 flex-grow-1">
      <div>
        <div className="input-group" aria-label={label}>
          <div className="input-group-prepend flex-grow-1">
            <div className="input-group-text w-100">
              <small className="text-uppercase">{label}</small>
            </div>
          </div>
          <TimeInput
            className={classnames(
              "form-control w-auto flex-grow-0",
              hasFocus && "border-primary",
              (visibleError || timeError) && "is-invalid"
            )}
            name={name}
            value={{
              hour,
              minute,
            }}
            onBlur={onBlur}
            onFocus={onFocus}
            onChange={onChange}
            disabled={disabled}
            refs={refs}
          />
        </div>
        {(timeError || visibleError) && (
          <div className="sr-only">
            <Form.Control.Feedback type="invalid">
              {timeError && <div>{timeError}</div>}
              {visibleHourError && <div>{hourError}</div>}
              {visibleMinuteError && <div>{minuteError}</div>}
            </Form.Control.Feedback>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetForm;
