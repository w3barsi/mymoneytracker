# Money Tracker Implementation Plan

## 1. Add the Notes Backend

- Create `convex/schema.ts` with a `notes` table containing `ownerId`, `title`, `body`, and `updatedAt`.
- Add an owner/update-time index for newest-first listing.
- Create `convex/notes.ts` with authenticated `list`, `get`, `create`, `update`, and `remove` functions.
- Derive ownership from Better Auth in every operation.
- Return `null` for missing or unauthorized note IDs without exposing ownership information.
- Paginate the notes list rather than using an unbounded Convex query.

## 2. Implement Amount Calculation

- Add a pure parsing utility that processes the note line by line.
- Recognize amounts only at the beginning of a line:
  - `1000`
  - `1000 groceries`
  - `-250 coffee`
  - `+25 refund`
  - `12.50 lunch`
- Reject leading whitespace, malformed amounts, and normal text.
- Treat unsigned and `+` amounts as additions and `-` amounts as deductions.
- Use integer cents internally to avoid floating-point rounding errors.
- Preserve every line in the note regardless of whether it affects the total.

## 3. Replace the Landing Page

- Rewrite `src/routes/index.tsx`.
- Show unauthenticated users a concise project summary and a `Get started` button linking to `/login`.
- Show authenticated users a header, create-note button, notes list, and empty state.
- Show each note's title, a short body preview, and last-updated time.
- Create an empty note and navigate directly to `/$noteId` when the user adds a note.
- Add a load-more control when the user has more notes than the initial page.

## 4. Add the Protected Editor

- Create `src/routes/_auth/$noteId.tsx`, producing URLs such as `/abc123`.
- Add a header with a back button, editable centered title, and delete action.
- Display the calculated total in a bordered summary area.
- Place the multiline note editor beneath the total.
- Autosave the title and body after a short typing debounce.
- Show subtle `Saving`, `Saved`, and failure states.
- Flush pending edits before the editor's Back action.
- Confirm deletion, then return to `/`.
- Show a friendly not-found state for invalid, deleted, or inaccessible notes.

## 5. Remove Starter Application UI

- Remove the existing `/app` route files.
- Remove the `_DELETE_ME_intro_page` landing component once unused.
- Update login branding, document title, description, and favicon configuration.
- Keep the existing pathless `_auth` layout so only `/$noteId` requires authentication.
- Keep `/` publicly accessible and render its view from the current authentication state.
- Regenerate `src/routeTree.gen.ts` through TanStack tooling rather than editing it manually.

## 6. Use Repository UI Conventions

- Use the existing shadcn buttons, inputs, dropdowns, theme toggle, and semantic colors.
- Add `textarea` and `alert-dialog` through `vpr ui add`.
- Keep the layout responsive, narrow, and note-focused on desktop and mobile.
- Use Lucide icons for back, add, delete, and loading actions.

## 7. Verification

- Add parser tests covering signs, decimals, descriptions, invalid lines, ordinary text, and precision.
- Run Convex code generation.
- Run `vpr lint`, `vp check`, and `vp test`.
- Manually verify authentication, the empty state, note creation, autosaving, totals, deletion, direct URLs, and the mobile layout.
