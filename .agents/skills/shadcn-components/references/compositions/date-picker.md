# date-picker (composition)

## Objective

Build date selection experiences by composing `Popover` + `Calendar` with optional `Button`, `Field`, `InputGroup`, and `Input` primitives.

## Core Composition

- Use `PopoverTrigger` as the control surface (`Button` or `InputGroupButton`).
- Render `Calendar` in `PopoverContent`.
- Keep selected state in React and format display with `date-fns`.

```tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" className="justify-start font-normal" />}
      >
        {date ? format(date, "PPP") : <span>Pick a date</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={date} />
      </PopoverContent>
    </Popover>
  )
}
```

## High-value Variants

- Basic picker: single date with button trigger.
- Range picker: `Calendar` with `mode="range"`, two months, formatted range text.
- Date of birth: dropdown caption layout and close-on-select behavior.
- Input picker: editable text input + calendar popover synchronization.
- Time picker: date picker composed next to a `type="time"` input.
- Natural language picker: parse text (for example with `chrono-node`) and sync to calendar.

## Composition Guidance

- Pair with `Field` / `FieldLabel` for form context and accessible labeling.
- Pair with `InputGroup` when keyboard entry and icon trigger are both needed.
- Keep month state separately when supporting typed input.
- Close popover after selection when the flow should be single-step.