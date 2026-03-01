# typography

Reusable typography components with predefined styles based on CVA. All components accept `children` for customizable content and `className` to modify their styles.

```tsx
import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography"

export default function TypographyExample() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <TypographyH1>Taxing Laughter: The Joke Tax Chronicles</TypographyH1>
      <TypographyLead>A modal dialog that interrupts the user with important content and expects a response.</TypographyLead>
      <TypographyH2>The People of the Kingdom</TypographyH2>
      <TypographyP>The king, seeing how much happier his subjects were, realized the error of his ways and repealed the joke tax.</TypographyP>
      <TypographyH3>The Joke Tax</TypographyH3>
      <TypographyP className="text-red-500">Customize styles with className</TypographyP>
      <TypographyH4>People stopped telling jokes</TypographyH4>
      <TypographyList>
        <li>1st level of puns: 5 gold coins</li>
        <li>2nd level of jokes: 10 gold coins</li>
        <li>3rd level of one-liners: 20 gold coins</li>
      </TypographyList>
      <TypographyBlockquote>&quot;After all,&quot; he said, &quot;everyone enjoys a good joke, so it&apos;s only fair that they should pay for the privilege.&quot;</TypographyBlockquote>
      <div className="space-x-2">
        <TypographyLarge>Are you absolutely sure?</TypographyLarge>
        <TypographySmall>Email address</TypographySmall>
        <TypographyMuted>Enter your email address.</TypographyMuted>
        <TypographyInlineCode>@radix-ui/react-alert-dialog</TypographyInlineCode>
      </div>
    </div>
  )
}
```

## Props

All components share the same interface:

- `children: ReactNode` - Content to render
- `className?: string` - Additional classes to customize styles (merged with base styles)

## Usage Examples

```tsx
// Basic usage
<TypographyH1>My title</TypographyH1>

// With custom styles
<TypographyH1 className="text-red-500 underline">
  Custom title
</TypographyH1>

// With dynamic content
<TypographyP>{variableContent}</TypographyP>
```

## Available Variants

Each component exports its own CVA function for advanced usage:

- `h1Variants`, `h2Variants`, `h3Variants`, `h4Variants`
- `pVariants`, `blockquoteVariants`, `listVariants`
- `inlineCodeVariants`, `leadVariants`, `largeVariants`
- `smallVariants`, `mutedVariants`

## Notes

- All components accept `children` prop to provide customizable content.
- The `className` prop is intelligently merged with base styles using `cn()`.
- Base styles are defined via CVA for consistency with other components.
- Use typography primitives to create consistent hierarchy before adding interactive components.
- Combine with `Card`, `Field`, `Table`, and `Alert` to improve readability and context.
- Prefer semantic heading order (`h1` -> `h2` -> `h3`) for accessibility.