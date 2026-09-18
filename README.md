# IIE-Harvard-Anglia-Referencing-Generator
A website which generates reference lists based on input fields

# Changelog

## [Unreleased] — CSS unification, logo fix & responsive design

### Added
- **Single shared stylesheet**: `_css/style.css` now styles all four pages (`index.html`, `about.html`, `contact.html`, `guide.html`). Previously only `index.html` linked it; the other three pages carried their own inline `<style>` blocks with a different (blue, `#007BFF`) theme.
- **Responsive breakpoints** (section 3.1 of the brief):
  - `@media (max-width: 48rem)` (~tablet): collapses the contact page's two-column layout, the guide's 3-column "how to" grid, and the about page's feature grids down to fewer/one column; moves the page title below the logo row so nav links don't get squeezed.
  - `@media (max-width: 30em)` (~mobile): switches remaining grids to a single column, shrinks the logo/title/nav type sizes, and stacks the autofetch input/buttons.
- **Relative units** (section 3.2): headings, spacing and the logo now use `rem`/`em`/`clamp()` instead of fixed pixel values; grid layouts use `fr`/`%` so columns resize fluidly instead of a fixed pixel width.
- **Responsive image handling** (section 3.3): global `img { max-width: 100%; height: auto; }` plus a `picture { width: 100%; }` rule so any image (including a future `<picture>`/`srcset` logo) always scales to its container instead of overflowing on small screens.
- New CSS for content that previously had no styling at all: about-page feature grid, contact-page form/info cards, and guide-page "how to" steps, rule cards and code blocks — all now themed to match the retro-terminal look already used on the home page.
- `CHANGELOG.md` (this file).

### Fixed
- **Logo placement bug**: the logo `<img>` and the menu-toggle button are now grouped in a single `.nav-brand` flex container with a dedicated `.nav-logo` class controlling size/alignment. Previously the logo's position depended on an inline `style="height:100%;max-width:100px"` and inconsistent markup between pages, which made it drift out of line with the menu button and title on some pages/screen widths.
- Removed a duplicated, nested `<header><header>...</header></header>` in `index.html` that was creating an extra, unstyled navigation bar.
- Removed trailing spaces inside `id`/`data-target` attributes in `index.html` (`"in-text-output "`, `"reference-list-output "`), which would have silently broken `document.getElementById()` / `querySelector` lookups in the generator's JS.
- Removed a duplicate stray `</p>` in the `index.html` footer.
- Removed a redundant duplicate `<h1>` on `about.html` (the page had both `About the IIE Reference Generator` and `// About the Generator` as separate top-level headings).

### Changed
- Standardised the header/nav/sidebar markup so it is now identical across all four pages (previously `about.html`/`contact.html`/`guide.html` used a slightly different structure than `index.html`, which is part of what caused the logo misalignment).
- Unified the visual theme: all pages now use the green-on-black "terminal" theme from `_css/style.css` instead of the blue Bootstrap-like inline theme that `about.html`/`contact.html`/`guide.html` had.
- Buttons, inputs, `<select>` and `<textarea>` now share one consistent style/hover state site-wide.

### Notes / follow-ups
- The sidebar (`#side-menu`) and mobile hamburger button (`#menu-toggle`) now have real CSS (slide-in panel + overlay), but the open/close **behaviour** still depends on the `TODO` JavaScript mentioned in the HTML comments — the CSS alone won't toggle the `.open`/`.active` classes.
- If you have an actual `@2x` logo asset, add a `srcset` to the `<img>` in the `.nav-logo` for sharper logos on high-DPI screens — this wasn't added since no second image file was supplied.
