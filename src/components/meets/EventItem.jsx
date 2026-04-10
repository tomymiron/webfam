import { timeGetter } from "../../constants/timeGetter";
import { useEffect } from "react";

export default function EventItem({ event }) {
  useEffect(() => {import("./styles/eventItem.scss")}, []);

  const categoryText = event?.categories.map((category) => category).join(" - ");
  const flags = [
    event?.only_fam ? "FAM" : null,
    event?.label || null
  ].filter(Boolean).join(" - ");
  const fullText = [categoryText, flags].filter(Boolean).join(" - ");

  return (
    <div className={`eventItem${event?.admin_only ? " adminOnly" : ""}`}>
      <div className="timeAndCategories">
        <p className="time">{timeGetter(event?.time)}</p>
        {fullText && <p className="categories">{fullText}</p>}
      </div>
      <p className="event">{event?.discipline}</p>
    </div>
  );
}