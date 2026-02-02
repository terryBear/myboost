import * as React from "react";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
}: React.ComponentProps<"div"> & {
  classNames?: Record<string, string>;
  showOutsideDays?: boolean;
}) {
  return <p></p>;
}
Calendar.displayName = "Calendar";

export { Calendar };
