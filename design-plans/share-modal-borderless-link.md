# Borderless share controls with a 16px preview

Written against: `f4f9b04d25479eeb4df075939efe942c7d9f8359`

Status: Revised user-selected design; implemented and verified.

The user replaced the original detached-copy treatment with a borderless URL
pill containing the copy control, removed the enclosing glass panel, and then
confirmed distinct corner treatments: pill-shaped URL/copy and X controls,
with a 16px preview radius. Most recently, the user explicitly required the
entire URL-and-copy pill to receive the glass effect, not just its child button.

## Evidence chain

- Surface: Public share modal, observed on `/` at `http://localhost:3000/`, sharing a photo.
- Problem: The share modal has an enclosing glass panel; the URL has a 1px perimeter border; its embedded copy button has a 1px left divider and square left corners; and the preview radius is smaller than requested.
- Design evidence: The user first selected a detached copy pill, then explicitly revised that decision to one borderless URL pill containing a full-pill copy control, with X remaining separate. The user further specified a 16px radius on the preview only. `.liquid-glass` supplies borderless pill controls; `OGTile` currently owns the preview's 6px radius.
- Owner: `src/share/ShareModal.tsx`. `app/layout.tsx` renders `ShareModals`, which selects photo, album, query, recents, year, film, or recipe wrappers; each renders the shared `ShareModal`.
- Scope and affected surfaces: URL/action row in all seven share variants.
- Uncertainty: None about the selected treatment. Narrow-screen fit, preview radius scoping, and glass clipping require validation after implementation. Native sharing was not available in the audited browser.

## Design decision

Remove only this modal's glass panel using `Modal container={false}`, while retaining its existing responsive width and spacing in a local layout wrapper. Keep the existing preview visually intact except for its explicitly selected 16px radius, scoped only to share previews. Combine the URL and copy control inside one borderless pill; apply the glass effect to the combined wrapper and avoid nested glass/shadows on the copy button. Keep the copy button keyboard focus visible, and retain hover feedback on the entire pill. Keep X as a separate full pill alongside the optional native-share action.

## Reuse

- `.liquid-glass` in `tailwind.css` supplies borderless pill corners, translucent fill, backdrop blur, highlights, and hover treatment to the combined URL/copy wrapper, as well as separate social/native actions. Copy focus styling stays visible without a nested glass effect.
- `rounded-full`, existing URL fill classes, row `h-10 gap-2`, and `shrink-0` action sizing.
- Existing `LoaderButton`, `SocialButton`, and `MaskedScroll`; no new component or CSS utility.
- `OGTile` is the preview owner and has no link-level class prop. Scope the 16px radius from the `ShareModal` preview wrapper rather than changing `OGTile` globally; all seven share variants render an `OGTile` anchor as the direct preview child.

## Changes

1. `src/share/ShareModal.tsx`
   - Change:
     - Use `container={false}` locally; put the existing responsive width (`w-[calc(100vw-1.5rem-2px)] sm:w-[min(540px,90vw)]`) and existing layout spacing on the inner wrapper. Do not change `Modal.tsx`.
     - Scope `rounded-2xl` to the direct preview anchor with a local wrapper selector; do not change the shared `OGTile` radius.
     - Keep the URL and copy inside one borderless `rounded-full liquid-glass` group. Apply the glass treatment only to that combined group; avoid a nested glass fill/shadow seam on copy. Preserve keyboard focus feedback on copy. Do not clip the group's glass treatment; constrain long URL scrolling on `MaskedScroll` itself.
     - Keep X separate from that group in the existing `flex items-stretch h-10 gap-2` row.
   - Preserve: Preview shape/content except the scoped 16px radius; URL text and horizontal masking, `fadeSize={50}`, scroll-to-end behavior, responsive text padding, 40px control height, icons, glass highlights, clipboard action, analytics, localized tooltip labels, 1800ms copy confirmation, optional native sharing, social destinations, backdrop, outside-click handling, and modal closing behavior.
   - Verify: URL/copy group and X have zero border widths and pill corners; URL/copy group computes a non-none backdrop-filter; preview has 16px corners; no outer glass panel remains; long URL scrolls without clipping the copy pill.

## Scope

- Inherit: Photo, album, query, recents, year, film, and recipe sharing through the shared `ShareModal`.
- Verify: Photo sharing plus a collection/query share with a long URL; native-share present and absent; copy tooltip and confirmed tooltip.
- Exclude: Global `Modal.tsx` changes; global `OGTile.tsx` radius changes and all non-share preview consumers; preview perimeter and image/caption divider; tooltip geometry; global glass styles; social button dimensions; unrelated sharing behavior.
- Do not remove `.liquid-glass-square-left` or `.liquid-glass-border-left` globally; only remove their use in this share row.

## Validation

- Product: Open a photo share, copy its URL, and confirm the exact destination is copied and the confirmation tooltip still appears and resets. Confirm social and native-share payloads are unchanged; retain the optional native-share action when supported.
- Interface:
  - Check 320px, 390px, and desktop viewport widths in light and dark themes.
  - Inspect URL/copy group and X bounding boxes: no overlap and no horizontal modal overflow.
  - Confirm computed border widths are `0px` on every side for URL/copy group, copy, and X; URL/copy group, copy, and X have pill rounding; combined URL/copy group has a glass backdrop-filter and a single continuous glass treatment; preview has 16px radius.
  - Confirm long URLs scroll within the URL area, controls remain in the group, and the embedded copy control's glass highlight/shadow are not clipped.
  - Confirm the enclosing glass panel is absent while the black backdrop, outside-click close behavior, preview shape, and responsive sizing remain.
  - Exercise hover and copy-confirmed tooltips. Verify native sharing in a supporting browser; do not infer it from an absent button.
- System: Keep modal changes local to `ShareModal.tsx`; use the preview wrapper selector for share-only radius. Reuse `.liquid-glass` without creating parallel styles or modifying shared preview/modal owners.
- Repository: Read applicable guidance under `node_modules/next/dist/docs/` before writing product code. Run `pnpm exec eslint src/share/ShareModal.tsx` and `pnpm exec tsc --noEmit` after implementation; expect no introduced errors. Distinguish any existing errors from this change.

## Verification results

- `pnpm exec eslint src/share/ShareModal.tsx` and `git diff --check` pass.
- `pnpm exec tsc --noEmit` reports pre-existing JSX syntax errors in
  `src/components/DateTimePicker.tsx` (lines 182, 202, and 308–310); this change
  does not modify that file.
- In the active photo-share browser view, checked 320px, 390px, and 1280px in
  light and dark themes. URL group, copy, and X have 0px borders; all controls
  have pill radii; preview computes to 16px; the row has no horizontal overflow.
- A synthetic long URL overflows inside the masked URL scroll area while the
  copy stays within the pill and X stays separate. The copy confirmation tooltip
  appears and resets; clicking outside closes the modal. Computed ancestors have
  no enclosing glass fill, border, radius, or shadow.
- Native sharing is unavailable in this browser; the optional `navigator.share`
  action remains in source.
- On the active browser view, the combined URL/copy wrapper computes a
  `backdrop-filter` of `blur(14px) saturate(1.45)`, 0px borders, and pill radius.
  Copy has no nested glass backdrop or shadow; the wrapper's hover selector
  applies across its URL and copy descendants. The copy button itself computes
  0px borders, pill radius, transparent background, and no shadow, with a
  visible keyboard-focus outline class.

## Stop conditions

- Stop if narrow-screen validation requires hiding actions, changing URL content, or changing the modal's structure beyond this row.
- Stop if the implementation requires global changes to glass, preview, or tooltip owners; those are outside the accepted scope.

## Design documentation

- This plan records the revised local user-selected treatment, not a site-wide ban on borders or a requirement that all surfaces be pill-shaped. No governing `DESIGN.md` was found.
