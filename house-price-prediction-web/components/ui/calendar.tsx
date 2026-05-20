"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";

import "react-day-picker/style.css";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  numberOfMonths,
  navLayout,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();
  const resolvedNavLayout = navLayout ?? ((numberOfMonths ?? 1) > 1 ? "around" : undefined);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      numberOfMonths={numberOfMonths}
      navLayout={resolvedNavLayout}
      className={cn("p-3", className)}
      classNames={{
        root: cn(defaultClassNames.root),
        months: cn("flex flex-col gap-6 sm:flex-row sm:items-start", defaultClassNames.months),
        month: cn("space-y-3", defaultClassNames.month),
        month_caption: cn(defaultClassNames.month_caption),
        caption_label: cn("text-sm font-normal tracking-[0.16px]", defaultClassNames.caption_label),
        nav: defaultClassNames.nav,
        button_previous: cn(
          "relative z-10 inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "relative z-10 inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0",
          defaultClassNames.button_next,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: defaultClassNames.weekdays,
        weekday: cn("h-10 w-10 p-0 text-center text-xs font-normal", defaultClassNames.weekday),
        week: defaultClassNames.week,
        weeks: defaultClassNames.weeks,
        day: cn("h-10 w-10 p-0 text-center text-sm", defaultClassNames.day),
        day_button: cn(
          "inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 font-normal tracking-[0.16px]",
          defaultClassNames.day_button,
        ),
        selected: defaultClassNames.selected,
        today: defaultClassNames.today,
        outside: defaultClassNames.outside,
        disabled: defaultClassNames.disabled,
        range_middle: defaultClassNames.range_middle,
        range_start: defaultClassNames.range_start,
        range_end: defaultClassNames.range_end,
        hidden: defaultClassNames.hidden,
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...iconProps }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;

          return (
            <Icon
              {...iconProps}
              className={cn("h-4 w-4 shrink-0", className)}
              strokeWidth={1.5}
              fill="none"
              aria-hidden
            />
          );
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
