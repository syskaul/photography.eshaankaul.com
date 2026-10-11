# Make every tooltip pill-shaped

Written against: `8bb72f900f96902441a9f533a5c8615c90e35b8d` (the worktree already has edits in `TooltipPrimitive.tsx`; preserve them)

## Evidence chain

- Surface: All tooltip surfaces in the photography application, including public photo controls, navigation, sharing, and admin controls.
- Problem: The shared tooltip surface explicitly receives `rounded-lg`, so its corners are not fully pill-shaped.
- Design evidence: The user selected pill-shaped corners for every tooltip. `ComponentSurface` provides the shared tooltip panel, while `TooltipPrimitive` applies `rounded-lg` to it. Existing `rounded-full` utilities are used elsewhere in the application.
- Owner: `src/components/primitives/TooltipPrimitive.tsx`, rendered through `src/components/Tooltip.tsx`.
- Scope and affected surfaces: Every `Tooltip` consumer, including direct tooltip content and tooltip props on shared controls such as `LoaderButton` and `SwitcherItem`.
- Uncertainty: None; the requested pill shape is confirmed. Keep the current width, padding, content, surface color, and trigger behavior.

## Design decision

Replace the shared tooltip panel's `rounded-lg` utility with `rounded-full`. This makes every tooltip pill-shaped at its single shared owner, without changing tooltip content or geometry.

## Reuse

- Tailwind `rounded-full` utility; retain `ComponentSurface` and its existing color variants.
- Exemplar: `src/components/primitives/TooltipPrimitive.tsx`

## Changes

1. `src/components/primitives/TooltipPrimitive.tsx`
   - Change: Apply `rounded-full` to the `ComponentSurface` used as tooltip content.
   - Preserve: Existing `className` composition, width and padding limits from `ComponentSurface`, tooltip colors, text wrapping, animation, positioning, and trigger behavior. Integrate with the file's existing worktree edits rather than replacing them.
   - Verify: Tooltips with short labels and multiline content all render with fully rounded capsule corners.

## Scope

- Inherit: Every surface using the shared `Tooltip` component or tooltip props that render through it, including public and admin controls.
- Verify: A short navigation/control tooltip, a multiline tooltip, and a tooltip using a non-default surface color; confirm the shape is consistent across them.
- Exclude: Changes to tooltip sizing, spacing, content, timing, placement, triggers, or unrelated `ComponentSurface` instances.

## Validation

- Product: Open representative public and admin tooltip triggers and confirm their tooltip panels are pill-shaped.
- Interface: Check both short and wrapped content, default and non-default surface colors, and desktop and touch-supported layouts; confirm text remains legible and no content is clipped.
- System: Confirm all tooltip panels still render through `TooltipPrimitive` and no parallel tooltip shape implementation is introduced.
- Repository: Run the repository's existing lint/type-check command for the changed TSX file → expected to pass.

## Stop conditions

- Stop if a tooltip consumer intentionally depends on a non-pill corner radius; do not silently exempt it because the request is for all tooltips.
- Stop if the existing `TooltipPrimitive.tsx` worktree edits cannot be preserved while applying the shape change.

## Design documentation

- After acceptance and validation: None; the user-selected change is fully specified by this plan and does not require a new design-system rule.
