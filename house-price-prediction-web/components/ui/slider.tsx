"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const thumbCount = React.useMemo(() => {
    if (Array.isArray(value)) {
      return value.length;
    }

    if (Array.isArray(defaultValue)) {
      return defaultValue.length;
    }

    return 1;
  }, [value, defaultValue]);

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow overflow-hidden rounded-none bg-[var(--portal-color-border)]"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full rounded-none bg-[var(--portal-color-primary)]"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          data-slot="slider-thumb"
          className={cn(
            "block size-4 shrink-0 rounded-none border border-[var(--portal-color-primary)] bg-[var(--portal-color-surface)] shadow-sm",
            "transition-[box-shadow] outline-none",
            "focus-visible:ring-[3px] focus-visible:ring-[var(--portal-color-primary)]/30",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
