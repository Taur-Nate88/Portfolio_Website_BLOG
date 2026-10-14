# OPENFRAME v5 — professional portfolio and blog

A complete, neutral, light-colored website for showcasing **all kinds of projects** and publishing articles, screenshots and case studies without WordPress. Designed for:

- **GitHub** for the source files and content storage
- **Pages CMS** for writing articles and uploading pictures in your browser
- **Cloudflare Pages** for hosting the public website (free static hosting tier)

The site has a homepage, projects index, dedicated project pages, a searchable/category-filtered journal, individual blog article pages, and an About page. The same design works for software, applications, games, experiments, writing and portfolio case studies.

The included example content is for demonstration only. **Football Chronicle** is a sample project entry based on the actual game, and **The Prototype Archive** plus the sample journal articles should be edited or replaced before publishing as your own completed work.

## 1. See the design before deployment

Open **`PREVIEW.html`** in Chrome or Firefox. This one-page preview contains the entire homepage styling and artwork, so it works offline. Preview navigation jumps to homepage sections. The real deployed site has separate functional pages for Projects, Journal, About, and every post/project.

## 2. Create your free GitHub repository

1. Sign into https://github.com and create a new repository (e.g. `my-project-portfolio`).
2. Extract this zip file. Open a terminal **inside** the `openframe-portfolio-v5` folder containing `build.mjs`, `package.json` and `.pages.yml`.
3. Upload or push these source files to the **root of the repository**. On Linux, use `ls -la` to make sure `.pages.yml` was included (files starting with a dot can be hidden).

If you use git in the terminal:

```bash
git init
git add .
git commit -m "Create project portfolio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the example GitHub URL with the URL of your repository. GitHub may require browser-based login, an SSH key or a token when pushing. You can also use GitHub's web interface to upload the source files, taking care to include hidden files.

## 3. Deploy on Cloudflare Pages

1. Create a free Cloudflare account at https://dash.cloudflare.com.
2. Go to **Workers & Pages → Create application → Pages → Connect to Git** (UI wording may vary).
3. Authorize GitHub and select your repository.
4. Use these settings:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |

Cloudflare will install/run Node and create all HTML pages; no npm packages are required. Once deployed, you receive an address such as `my-project-portfolio.pages.dev`.

**Important:** Create the Cloudflare Pages project through **Connect to Git**, not Direct Upload, so changes published through Pages CMS automatically trigger a new deployment.

## 4. Edit articles, projects and website settings with Pages CMS

1. Go to **https://app.pagescms.org** and sign in with GitHub.
2. Authorize Pages CMS for your repository and open it (select the `main` branch if asked).
3. Pages CMS reads the included `.pages.yml` and displays:
   - **Blog posts** — create articles, choose dates, set categories, attach cover images, write body text and insert screenshots.
   - **Projects** — add portfolio items with images, descriptions, status and full case studies.
   - **Website settings** — change the brand name, homepage headline, introduction, author information and footer details.
4. Save a change. Pages CMS commits it to GitHub, and Cloudflare rebuilds your site automatically. A new post gets an individual page and appears in the Journal listing.

You can add as many posts and projects as needed within the free providers' usage limits. Filenames act as post URLs: changing a filename/slug later changes the page address.

**What is editable through Pages CMS?** Project covers, post images, text, headings, post dates/categories, featured flags, homepage brand text, About bio and optional contact details. The layout and colors live in CSS and must be changed in the website source files.

## 5. Connect your existing WordPress.com domain

You can keep the domain **registered at WordPress.com** and host the website on Cloudflare. No domain transfer or new domain purchase is necessary.

1. Test the new Cloudflare `pages.dev` website first.
2. Add your existing domain to Cloudflare's Free DNS plan.
3. Carefully copy/check all your current DNS records, especially email records (MX, SPF, DKIM and relevant TXT records) and subdomains, **before switching nameservers**.
4. WordPress.com → Domains → choose your domain → Name servers: replace the current nameservers with those assigned by Cloudflare. Domain control-panel labels may vary.
5. Cloudflare → Workers & Pages → Your Pages project → Custom domains: add your domain and finish DNS/HTTPS verification.
6. Confirm your site and any email continue to work. DNS changes can take time to propagate.

Do **not** cancel your domain registration. If you have a separate paid WordPress website plan, that can be cancelled once the new website is fully working, if you no longer need it.

## 6. Local editing and previews

Requires **Node.js 20 or newer**:

```bash
npm run build
npm run preview
```

Open `http://127.0.0.1:4321/` on your own computer. No `npm install` is necessary because the builder uses only built-in Node.js modules. The resulting website is in `dist/`.

## Project structure

```text
.pages.yml                   Pages CMS content and media settings
content/site.json            Home/About branding settings
content/posts/*.json         Blog articles
content/projects/*.json      Portfolio projects
public/media/                Artwork and uploaded screenshots
public/assets/style.css     Site design, colors and layout
public/assets/site.js       Mobile navigation and journal search
build.mjs                    Dependency-free static site builder
preview.mjs                  Local HTTP preview server
PREVIEW.html                 One-file offline visual homepage preview
README.md                    These instructions
dist/                        Built site (generated, not committed)
```

This design uses original SVG artwork created for the template, system fonts, and no external tracking scripts. You may replace the sample artwork with your own screenshots and photographs through Pages CMS.

## Hosting costs, backups and limitations

- Cloudflare Pages free plan + GitHub free plan + Pages CMS free editor: **€0 per month** for a normal static blog within their plan limits.
- You still pay your existing domain's **annual registration/renewal fee** to WordPress.com.
- No VPS is needed for articles or project portfolios. A continuously running Python game backend would need a different service.
- Pages CMS edits content in GitHub, so you should periodically download/back up your entire repository. Your website is ordinary portable source files.
- No built-in email inbox, comments, visitor accounts, newsletter, or large game download hosting.
- The package has been locally built and visually inspected with desktop/mobile previews, and its navigation/search were exercised locally. **It has not been deployed or authenticated to your actual Cloudflare/Pages CMS/GitHub accounts**.

## Documentation

- Pages CMS: https://pagescms.org/docs/
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Cloudflare Git deployment: https://developers.cloudflare.com/pages/get-started/git-integration/


## v3 logo update

This version includes a new professional logo inserted into the site header and footer at `public/media/commonplace-logo.png`.


## v4 — neutral wordmark (no squares)

The website header and footer now use a **text-only typographic logo**, with no four-square symbol. The logo uses `site_title` from `content/site.json`, editable in **Pages CMS → Website settings → Website name**. You may rename the portfolio without changing images or code. The favicon uses a simple C instead of the previous four-square emblem.


## v5 branding

- The brand is **OPENFRAME** by default.
- Wordmark-only logo, derived from `content/site.json` → `site_title`; no four-square mark or image logo.
- An O favicon is included in `public/favicon.svg`.
- Change the website name through **Pages CMS → Website settings → Website name**. The header/footer update when Cloudflare rebuilds. To change the tab icon to match another name, replace `public/favicon.svg`.
- `PREVIEW.html` provides a standalone homepage preview, while `dist/` contains the multi-page site after building.
