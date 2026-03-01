# Shadcn Component Objectives

Use this file as a quick intent-to-component map before opening the full example docs in `references/components/`.

## Core Components

- `accordion`: Show and hide grouped content sections to reduce visual noise.
- `alert-dialog`: Request high-stakes confirmation before destructive or irreversible actions.
- `alert`: Surface contextual status messages (info, warning, success, error).
- `aspect-ratio`: Preserve media proportions in responsive layouts.
- `avatar`: Represent users, teams, or entities with image/fallback identity marks.
- `badge`: Display compact status/category labels.
- `breadcrumb`: Show current location and hierarchy inside navigation.
- `button-group`: Arrange related actions as a single, cohesive control set.
- `button`: Trigger primary and secondary user actions.
- `calendar`: Provide day/month date selection and date visualization.
- `card`: Group related content and actions in a bounded container.
- `carousel`: Present sequential items with horizontal navigation.
- `chart`: Visualize quantitative data trends and comparisons.
- `checkbox`: Capture multi-select boolean choices.
- `collapsible`: Expand/collapse one section while keeping custom layout control.
- `combobox`: Combine search/filter and single-option selection.
- `command`: Offer command palette style search + action execution.
- `context-menu`: Expose right-click (or long-press) contextual actions.
- `dialog`: Show modal content that blocks background interaction.
- `direction`: Control LTR/RTL direction-aware UI behavior.
- `drawer`: Present side/bottom panel workflows without full page navigation.
- `dropdown-menu`: Show compact action menus from a trigger.
- `empty`: Display meaningful empty-state messaging and next actions.
- `field`: Provide composable form field structure, spacing, and helper text.
- `hover-card`: Reveal rich preview content on hover/focus.
- `input-group`: Compose input + inline addons/buttons into one control.
- `input-otp`: Capture one-time passcodes in segmented inputs.
- `input`: Capture free-form single-line text values.
- `item`: Standardize list/menu row presentation and interaction density.
- `kbd`: Render keyboard shortcut hints.
- `label`: Attach accessible text labels to form controls.
- `link`: Provide styled anchor tags with support for external links and custom routing components.
- `menubar`: Provide desktop-style top-level application menus.
- `native-select`: Use browser-native select behavior with system UX.
- `navigation-menu`: Build top-level site/app navigation with dropdown content.
- `pagination`: Navigate across paged datasets.
- `popover`: Show anchored floating content without full modal behavior.
- `progress`: Indicate completion progress for long operations.
- `radio-group`: Capture one choice from a mutually exclusive set.
- `resizable`: Enable user-resizable panel layouts.
- `scroll-area`: Provide stylable overflow scrolling regions.
- `select`: Offer custom-styled option selection control.
- `separator`: Visually and semantically divide content regions.
- `sheet`: Present modal side panel flows for focused tasks.
- `sidebar`: Build persistent app navigation rails and workspace panels.
- `skeleton`: Show loading placeholders that preserve layout structure.
- `slider`: Select numeric values across a bounded range.
- `sonner`: Show toast notifications for transient feedback.
- `spinner`: Indicate indeterminate loading activity.
- `switch`: Toggle binary on/off settings.
- `table`: Present structured tabular data with headers and cells.
- `tabs`: Switch between related views in the same page region.
- `textarea`: Capture multi-line text input.
- `toggle-group`: Choose one or multiple formatting/state toggles as a set.
- `toggle`: Represent a pressed/unpressed command state.
- `tooltip`: Provide short, non-blocking helper text on hover/focus.
- `typography`: Apply consistent text hierarchy and semantic content styling.

## Composed Patterns

- `date-picker`: Compose `Popover` + `Calendar` (often with `Button`, `Field`, `InputGroup`) to select single dates, ranges, DOB, or date+time workflows.
- `data-table`: Compose `Table`, `Input`, `DropdownMenu`, `Button`, `Checkbox`, and TanStack Table state/models for sorting, filtering, visibility, pagination, row actions, and row selection.

## Composition Rule of Thumb

Start from user intent, then combine primitives:

- Structure and clarity: `Card` + `Typography` + `Separator`.
- Form context: `Field` + `Label` + input control (`Input`, `Select`, `Checkbox`, `Switch`, etc.).
- Progressive disclosure: `Popover`/`Tooltip`/`HoverCard` for lightweight details, `Dialog`/`Sheet`/`Drawer` for heavier workflows.
- Data workflows: `Table` + `Pagination` + selection controls (`Checkbox`/`Toggle`).

Favor composition over isolated components to produce more informative, accessible, and production-ready UI.