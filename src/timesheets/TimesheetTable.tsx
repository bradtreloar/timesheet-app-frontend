import React from "react";
import { DateTime } from "luxon";
import { Link } from "react-router-dom";
import usePagination from "common/usePagination";
import { Timesheet } from "timesheets/types";

interface TimesheetTableProps {
  timesheets: Timesheet[];
}

const TimesheetTable: React.FC<TimesheetTableProps> = ({ timesheets }) => {
  const { items, Pager } = usePagination(timesheets);

  const tableRows = items.map((timesheet, index) => {
    const created = DateTime.fromISO(
      timesheet.created as string
    ).toLocaleString(DateTime.DATE_SHORT);
    const pathname = `/timesheet/${timesheet.id}`;

    return (
      <tr key={index}>
        <td>
          <Link to={pathname}>{created}</Link>
        </td>
      </tr>
    );
  });

  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th>Date submitted</th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
      </table>
      <div>
        <Pager />
      </div>
    </>
  );
};

export default TimesheetTable;
