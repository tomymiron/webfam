import { timeGetter } from "../../constants/timeGetter";
import { useEffect } from "react";

export default function EventItem({ event }) {
  useEffect(() => {import("./styles/eventItem.scss")}, []);

  return (
    <div className="eventItem">
      <div className="timeAndCategories">
        <p className="time">{timeGetter(event?.time)}</p>
        <p className="categories">{event?.categories.map((category) => category).join(" - ")}</p>
      </div>
      <p className="event">{event?.discipline}</p>
    </div>
  );
}