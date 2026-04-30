import * as React from "react";

import { cn } from "@/lib/utils";

export interface ThemeSwatchOption {
  id: string;
  /** CSS color value or var(--note-…) for the tile fill. */
  color: string;
  /** Visible label or accessible name. */
  label: string;
  /** Whether to show the label visually beneath the tile. Defaults to true. */
  showLabel?: boolean;
}

export interface ThemeSwatchPickerProps extends Omit<
  React.ComponentProps<"div">,
  "onChange"
> {
  options: ThemeSwatchOption[];
  /** Currently selected option id. */
  value?: string;
  /** Default selected id when uncontrolled. */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Tile size in px. Defaults to 40. */
  size?: number;
}

export function ThemeSwatchPicker({
  className,
  options,
  value,
  defaultValue,
  onChange,
  size = 40,
  ...props
}: ThemeSwatchPickerProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string | undefined>(
    defaultValue,
  );
  const selected = isControlled ? value : internal;

  const handleSelect = (id: string) => {
    if (!isControlled) setInternal(id);
    onChange?.(id);
  };

  return (
    <div
      data-slot="theme-swatch-picker"
      role="radiogroup"
      className={cn("theme-swatch-picker", className)}
      {...props}
    >
      {options.map((option) => {
        const isSelected = option.id === selected;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            data-slot="theme-swatch"
            data-id={option.id}
            data-selected={isSelected ? "true" : "false"}
            onClick={() => handleSelect(option.id)}
            className={cn(
              "theme-swatch",
              isSelected && "theme-swatch-selected",
            )}
          >
            <span
              aria-hidden
              className="theme-swatch-tile"
              style={{
                backgroundColor: option.color,
                width: `${size}px`,
                height: `${size}px`,
              }}
            >
              {isSelected && (
                <svg
                  className="theme-swatch-check"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12.5l4.5 4.5L19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            {option.showLabel !== false && (
              <span className="theme-swatch-label">{option.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
