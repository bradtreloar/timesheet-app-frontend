import usePagination from "common/usePagination";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, UserAttributes, UserSortOrder } from "users/types";
import { useSortedUsers } from "./hooks";

interface UserTableProps {
  users: User[];
}

interface TableHeadingProps {
  name: keyof UserAttributes;
  className?: string;
}

const defaultSortOrder: UserSortOrder = {
  attribute: "name" as keyof UserAttributes,
  ascending: true,
};

const UserTable: React.FC<UserTableProps> = ({ users }) => {
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const sortedUsers = useSortedUsers(users, sortOrder);
  const { items, Pager } = usePagination(sortedUsers);

  const handleClickHeading = (attribute: keyof UserAttributes) => {
    if (sortOrder.attribute === attribute) {
      setSortOrder({
        attribute,
        ascending: !sortOrder.ascending,
      });
    } else {
      setSortOrder({
        attribute,
        ascending: true,
      });
    }
  };

  const TableHeading: React.FC<TableHeadingProps> = ({
    name,
    className,
    children,
  }) => (
    <th className={className} onClick={() => handleClickHeading(name)}>
      {children}
      {sortOrder.attribute === name && (
        <span className="sort-icon ml-2">
          {sortOrder.ascending ? `▲` : `▼`}
        </span>
      )}
    </th>
  );

  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <TableHeading name="name">
              <span>Name</span>
            </TableHeading>
            <TableHeading name="isAdmin">
              <span>Account type</span>
            </TableHeading>
            <TableHeading name="email" className="text-right">
              <span>Email</span>
            </TableHeading>
          </tr>
        </thead>
        <tbody>
          {items.map((user, index) => {
            const userPageUrl = `/users/${user.id}`;
            return (
              <tr key={index} data-testid="user-index-table-row">
                <td>
                  <Link to={userPageUrl}>{user.attributes.name}</Link>
                </td>
                <td>
                  {user.attributes.isAdmin ? `Administrator` : `Employee`}
                </td>
                <td className="text-right">
                  <Link to={userPageUrl}>{user.attributes.email}</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div>
        <Pager />
      </div>
    </>
  );
};

export default UserTable;
