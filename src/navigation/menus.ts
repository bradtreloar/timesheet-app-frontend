import { CurrentUser } from "auth/types";

interface MenuItem {
  label: string;
  url: string;
  access?: "admin" | "authenticated" | "guest";
}

const menuItems: {
  [key: string]: MenuItem[];
} = {
  main: [
    {
      label: "New Timesheet",
      url: "/timesheet/new",
      access: "authenticated",
    },
    {
      label: "Timesheets",
      url: "/",
      access: "authenticated",
    },
    {
      label: "Users",
      url: "/users",
      access: "admin",
    },
    {
      label: "Settings",
      url: "/settings",
      access: "admin",
    },
    {
      label: "Log in",
      url: "/login",
      access: "guest",
    },
  ],
};

const getMenu = (name: string, user: CurrentUser | null) => {
  return menuItems[name].filter(({ access }) => {
    if (access === undefined) {
      return true;
    }
    switch (access) {
      case "admin":
        return user !== null && user.isAdmin;
      case "guest":
        return user === null;
      case "authenticated":
        return user !== null;
      default:
        return user !== null;
    }
  });
};

export default getMenu;
