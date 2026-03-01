# link

Reusable link component with predefined styles based on CVA. It supports an `external` prop to automatically append an external link icon.

```tsx
import { Link } from "@/components/ui/link"

export default function LinkExample() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="#">Default Link</Link>
      <Link href="#" variant="muted">Muted Link</Link>
      <Link href="#" variant="destructive">Destructive Link</Link>
      <Link href="https://example.com" external>External Link</Link>
    </div>
  )
}
```

## Props

- `variant?: "default" | "muted" | "destructive"` - The visual style of the link.
- `external?: boolean` - If true, appends an external link icon and sets `target="_blank"` and `rel="noopener noreferrer"`.
- `render?: React.ReactElement | ((props: any, state: any) => React.ReactElement)` - Allows replacing the underlying `<a>` element with a custom component (e.g., `react-router`'s `Link`).
- `children: ReactNode` - Content to render.
- `className?: string` - Additional classes to customize styles.

## Usage Examples

```tsx
// Basic usage
<Link href="/about">About Us</Link>

// With external prop
<Link href="https://github.com" external>
  GitHub
</Link>

// With react-router
import { Link as RouterLink } from "react-router"

<Link render={<RouterLink to="/dashboard" />}>
  Dashboard
</Link>
```

## Available Variants

- `default`: Primary text color with hover underline.
- `muted`: Muted text color that changes to foreground on hover.
- `destructive`: Destructive text color.

## Notes

- The `external` prop automatically adds `target="_blank"` and `rel="noopener noreferrer"` for security.
- Uses `@base-ui/react/use-render` to support the `render` prop, allowing seamless integration with routing libraries like `react-router` or `next/link`.
- The `className` prop is intelligently merged with base styles using `cn()`.
