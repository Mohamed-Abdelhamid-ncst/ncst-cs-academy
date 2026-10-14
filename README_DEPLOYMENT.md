# NCST Cybersecurity Academy Website — V2 Enhanced

## What is included
- Photo-rich responsive design
- English + Arabic website (`/ar/`)
- Training Catalogue driven by `assets/data/courses.json`
- Events & registration page driven by `assets/data/events.json`
- For Organisations portal
- Student Opportunities portal
- Certification pathways
- White Papers page with optional live OJS feed integration
- Contact / Training / Partnership forms
- SEO: canonical URLs, hreflang, Open Graph, Twitter Cards, JSON-LD Organization schema, sitemap
- Apache `.htaccess` and Nginx example
- Security-oriented headers and form validation

## Suggested production URL
https://cyberacademy.ncst.edu.bh

## Required pre-launch actions
1. Replace prototype logo and imagery with officially approved NCST assets.
2. Confirm partner names and public claims.
3. Confirm `cyberacademy@ncst.edu.bh`.
4. Configure HTTPS/SSL.
5. Configure approved mail delivery for PHP forms (or replace with NCST SMTP/API).
6. Configure `OJS_FEED_URL` environment variable if live White Papers are required.
7. Review Arabic copy with Arabic/Corporate Communications.
8. Add approved current news and official event dates.
9. Complete privacy, accessibility and security review.

## OJS live feed
`api/ojs-feed.php` reads an RSS/Atom feed URL from:
OJS_FEED_URL=https://<approved-ojs-feed-url>

If not configured, the public page displays a graceful message instead of failing.

## Forms
`forms/submit.php` appends every valid submission to `forms/data/submissions.jsonl` (one JSON object per line) and then tries to email it to `NCST_ACADEMY_EMAIL` (default `cyberacademy@ncst.edu.bh`). Set `NCST_ACADEMY_FROM` to an approved sender address (default `noreply@ncst.edu.bh`). The visitor sees the thank-you page as long as the submission was saved or emailed, so enquiries are not lost while mail delivery is still unconfigured; mail failures are written to the PHP error log.

- `forms/data/` must stay blocked from web access (Apache: its own `.htaccess`; Nginx: the `location ^~ /forms/data/` rule in the example config) and must be writable by PHP.
- The file holds personal data (names, emails, IP addresses). Review it regularly and apply NCST retention rules.

## HTTPS
`.htaccess` redirects to HTTPS only for `cyberacademy.ncst.edu.bh`. If the production host name changes, update the `RewriteCond %{HTTP_HOST}` line.

## 404 page
Apache routes missing resources to `404.php`, which returns HTTP 404 and renders `404.html` with the correct base URL for either a domain root or a subdirectory. Enable `mod_rewrite` and allow `.htaccess` overrides. The Nginx example uses `error_page` for the same handler.

## Local XAMPP preview
Open `http://localhost/NCST-Cyber/`. The workspace entry point redirects to this website folder. Keep the website folder together when deploying; the workspace entry point is only a convenience for local development.

## Catalogue and accessibility updates
- Course categories are generated from the JSON catalogue, including new categories added later. Search matches the displayed title, summary, audience and category.
- Course links use `contact.html?course=<course-id>#training`; the matching course and topic are prefilled, including when switching language. The requested course is included in saved and emailed enquiries.
- General enquiries require a message. Training requests require an organisation. PHP validates field lengths and UTF-8 before storing submissions; concurrent submissions share an atomic rate limit.
- All pages include a keyboard skip link; contact fields have labels, autocomplete and length limits. Mobile navigation supports Escape, outside clicks and keyboard focus, and motion respects system preferences.
- Run `node tests/verify.cjs` from the workspace root for catalogue behavior, form validation and local Apache checks. These tests disable email and use isolated temporary submission storage.

## Easy content updates
- Courses: `assets/data/courses.json`
- Events: `assets/data/events.json`
- Student opportunities: `assets/data/opportunities.json`

## Server
Apache: upload all files and keep `.htaccess`.
Nginx: use `nginx-site.conf.example` as a baseline. PHP-FPM is required for forms and OJS feed proxy.

## Important
The package is technically deployable, but institutional approval of content, photos, partner names, official branding and public forms remains required before public launch.
