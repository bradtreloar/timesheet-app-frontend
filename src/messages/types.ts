import { DateTime } from "luxon";

export type MessageType = "success" | "warning" | "danger";

export interface Message {
  id: string;
  value: string | JSX.Element;
  type: MessageType;
  tags: string[];
  created: DateTime;
}
