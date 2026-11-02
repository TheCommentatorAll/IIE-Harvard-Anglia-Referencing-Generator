# IIE-Harvard-Anglia-Referencing-Generator
A website which generates reference lists based on input fields

# Changelog

## [1.3.0] — 2026-11-02 — Zero-Backend Contact Form & AJAX Submission

### Added
- **Formspree Endpoint Integration**: Configured `contact.html` form action to point to a zero-backend Formspree endpoint (`https://formspree.io/f/your_form_id`) for seamless client-side email delivery without requiring dedicated backend server infrastructure.
- <img width="987" height="671" alt="image" src="https://github.com/user-attachments/assets/1c6f071d-c1ed-4ab7-ab4a-a5de1a38ce57" />
- <img width="488" height="418" alt="image" src="https://github.com/user-attachments/assets/5942d10b-2d3b-4284-995d-8feb40200a8b" />
- **Client-Side AJAX Form Submission**: Implemented an asynchronous `fetch()` event listener in `js/script.js` to process contact form submissions in the background without triggering full-page browser reloads.
- **Dynamic On-Screen Feedback**: Added real-time user notification handling via a `#form-status` element in `contact.html` to display progress (`[SENDING...]`), success notifications, and network error messages.
- **Automatic Form Reset**: Added logic to automatically clear form fields upon successful message dispatch.

### Changed
- **Zero-Cost Email Workflow**: Selected a zero-backend architecture relying on Formspree's free tier for instant developer inbox notifications alongside client-side terminal feedback.

## [1.2.0] — 2026-11-01 — JavaScript Integration, ID Alignment & Citation Engine Fixes

### Added
- **Complete Citation Generation Engine**: Implemented full IIE Harvard Anglia formatting rules inside `script.js` to dynamically generate both in-text citations and reference list entries across all supported source types.
- **Dynamic Form Handling**: Added robust event listeners to toggle source-specific fieldsets and dynamically add or remove author rows for books, journals, blogs, and student materials.
- **One-Click Clipboard Copying**: Integrated interactive copy functionality with instant visual feedback for both in-text and reference list output terminals.

### Fixed
- **Output Element ID Mismatch**: Fixed critical trailing space bugs in `index.html` output element IDs (`in-text-output` and `reference-list-output`), resolving the bug where generated citations failed to display at the bottom of the page.
- **Autofetch Field Mapping**: Aligned website and article autofetch ID targets in `script.js` to match the exact input field IDs in `index.html` (`web-page-title`, `web-site-title`, etc.), ensuring smooth automated metadata population without silent script crashes.
- **Local Link Navigation**: Removed unnecessary `target="_blank"` attributes from internal navigation links (`about.html`, `contact.html`, `guide.html`) to preserve seamless single-tab site browsing, keeping it strictly on external links alongside secure `rel="noopener noreferrer"` attributes.

### Changed
- **Code Maintainability & Commenting**: Added comprehensive inline comments throughout complex JavaScript blocks and HTML sections to clearly document use cases, ARIA labels, and dynamic data-flow behaviors for project review.

---

## [1.1.0] — 2026-10-19 — UI Polish, Accessibility & Robust Metadata Fetching

### Added
- **Animated Loading State**: Added smooth bouncing dot animations (`.loading-dots`) to the "Fetch Metadata" button during active API requests to provide clear visual feedback.
- **Robust URL Slug Fallback**: Implemented an automated fallback scraper for general websites and news articles (such as eNCA) that extracts readable titles directly from URL path slugs if deep server-side scraping is blocked by security firewalls[cite: 4, 5].

### Fixed
- **News Article Scraping & Routing**: Resolved an issue where news and article URLs were incorrectly triggering video-parsing paths or failing silently due to CORS/Cloudflare restrictions.
- **Strict Semantic HTML Headings**: Corrected heading hierarchies across all pages (`about.html`, `contact.html`, `guide.html`, and `index.html`), ensuring proper descending order (`<h1>` $\rightarrow$ `<h2>` $\rightarrow$ `<h3>`) and eliminating duplicate `<h1>` tags for accessibility and SEO compliance[cite: 4, 5].
- **Jekyll Folder Processing (404 Errors)**: Renamed directories from `_css`/`_js` to `css`/`js` to bypass GitHub Pages' default Jekyll underscore filtering, completely resolving live site 404 stylesheet and script errors.

### Changed
- **Enhanced Button Loading Feedback**: Updated script logic to swap button inner HTML dynamically during fetches, displaying an animated loading indicator before reverting to original text in a safe `try...finally` block.
- **Refined URL Detection Logic**: Tightened `detectSourceTypeFromUrl()` to strictly isolate real video streaming domains (YouTube, TikTok, Instagram) so general news and blog URLs correctly route to standard website metadata handlers.

---

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
