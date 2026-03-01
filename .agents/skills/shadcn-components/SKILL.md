---
name: shadcn-components
description: Provide implementation guidance for selecting, composing, and using shadcn UI components in React/TypeScript codebases. Use when a task asks to build or refactor UI with shadcn, choose the right component for a UX goal, combine multiple components into a cohesive pattern, or apply component examples from this repository.
---

# Shadcn Components Skill

Use this skill to map UX intent to shadcn components and implement composed, production-ready interfaces.

## Workflow

1. Identify user intent (data entry, feedback, navigation, overlay, layout, data display).
2. Read `references/component-objectives.md` to choose candidate components.
3. Open the specific example docs in `references/components/<component>.md`.
4. Prefer composition over isolated usage:
	 - Form flows: combine `Field`, `Label`, helper text, and input controls.
	 - Interactive disclosure: combine trigger + container (`Popover`, `Dialog`, `Sheet`, `Drawer`).
	 - Data views: combine `Table`, `Pagination`, selection controls, status components.
5. Implement the smallest valid composition that meets the requested UX.

## Composition Principle

Do not treat shadcn components as isolated widgets.

- A standalone control may satisfy functionality but fail communication.
- Compose with labels, descriptions, grouping, and contextual feedback to improve clarity and accessibility.
- Follow patterns from examples whenever possible, especially for checkboxes, dialogs, table selection, and date interactions.

## References

- `references/component-objectives.md`
	- Intent-to-component map with the objective of every component.
	- Read first when deciding which component(s) to use.
- `references/components/*.md`
	- Canonical examples for all components in this repository.
	- Includes all listed components plus a manually created `typography.md`.
- `references/compositions/date-picker.md`
	- Composition guidance for Date Picker patterns (`Popover` + `Calendar` + optional form controls).
- `references/compositions/data-table.md`
	- Composition guide for TanStack-powered Data Table patterns (sorting, filtering, visibility, pagination, row actions, selection).

## Implementation Rules

- Keep all guidance and code in English.
- Preserve existing design tokens and component APIs.
- Reuse existing examples before inventing new structures.
- Prefer explicit accessible labeling (`Label`, `FieldLabel`, `aria-*`) and helper text.
- When multiple components can solve the same problem, choose the simplest composition that communicates intent clearly.

## Quick Selection Heuristics

- Need lightweight floating details: `Tooltip` or `Popover`.
- Need blocking confirmation or task flow: `AlertDialog`, `Dialog`, `Sheet`, or `Drawer`.
- Need single choice from many: `Select`, `NativeSelect`, or `Combobox`.
- Need many related inputs: `Field` + control + description + validation states.
- Need richer date interactions: use the Date Picker composition reference.
- Need interactive datagrids: use the Data Table composition reference.

## Output Expectation

Produce UI that is informative, accessible, and compositional by default.

