import fs from 'node:fs';
import path from 'node:path';

// Tiny dependency-free static builder. Pages CMS edits JSON content files;
// Cloudflare/GitHub runs this file each time the repository changes.
const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content');
const PUBLIC = path.join(ROOT, 'public');
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const site = readJSON(path.join(CONTENT, 'site.json'));
const safeText = (v = '') => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const slugify = (v) => String(v).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,85) || 'untitled';
const safeUrl = (v, fallback = '#') => {
  const s = String(v ?? '').trim();
  if (!s || /[\u0000-\u001f\u007f<>"']/u.test(s)) return fallback;
  if (/^\/(?!\/)/.test(s) || /^https?:\/\//i.test(s) || /^mailto:/i.test(s)) return safeText(s);
  return fallback;
};
const img = (v, alt = '', cls='') => `<img src="${safeUrl(v || '/media/project-archive.svg')}" alt="${safeText(alt)}" loading="lazy" decoding="async" ${cls ? `class="${cls}"` : ''}>`;
function parseInline(input = '') {
  let s = safeText(input);
  const placeholders = [];
  const hold = (html) => { const key = `QQPLACE${placeholders.length}QQ`; placeholders.push(html); return key; };
  s = s.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${code}</code>`));
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;.*?&quot;)?\)/g, (_, alt, url) => hold(`<img src="${safeUrl(url)}" alt="${alt}" loading="lazy">`));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => hold(`<a href="${safeUrl(url)}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`));
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/~~([^~]+)~~/g,'<del>$1</del>');
  return s.replace(/QQPLACE(\d+)QQ/g, (_, n) => placeholders[Number(n)] || '');
}
function markdown(input = '') {
  const lines = String(input).replace(/\r\n/g,'\n').split('\n');
  let out = '', i = 0;
  const isSpecial = (s) => /^\s*(#{1,6} |[-*+] |\d+\. |>|```|---\s*$|\*\*\*\s*$)/.test(s);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = /^\s*```([\w-]*)/.exec(line);
    if (fence) {
      i++; const chunk=[]; while(i < lines.length && !/^\s*```/.test(lines[i])) chunk.push(lines[i++]);
      if(i<lines.length)i++;
      out += `<pre><code>${safeText(chunk.join('\n'))}</code></pre>`; continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { const level = Math.min(4, h[1].length+1); out += `<h${level}>${parseInline(h[2])}</h${level}>`; i++; continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { out += '<hr>'; i++; continue; }
    if (/^\s*>\s?/.test(line)) {
      const parts=[]; while(i<lines.length && /^\s*>\s?/.test(lines[i])) parts.push(lines[i++].replace(/^\s*>\s?/,''));
      out += `<blockquote>${parts.map(p=>`<p>${parseInline(p)}</p>`).join('')}</blockquote>`;continue;
    }
    const ul = /^\s*[-*+]\s+/.test(line), ol = /^\s*\d+\.\s+/.test(line);
    if(ul||ol) {
      const tag=ul?'ul':'ol', pattern=ul?/^\s*[-*+]\s+/:/^\s*\d+\.\s+/;
      const els=[];
      while(i<lines.length && pattern.test(lines[i])) els.push(`<li>${parseInline(lines[i++].replace(pattern,''))}</li>`);
      out += `<${tag}>${els.join('')}</${tag}>`;continue;
    }
    const paragraph=[line.trim()];i++;
    while(i<lines.length && lines[i].trim() && !isSpecial(lines[i])) paragraph.push(lines[i++].trim());
    out+=`<p>${parseInline(paragraph.join(' '))}</p>`;
  }
  return out;
}
function getEntries(folder){
  return fs.readdirSync(path.join(CONTENT,folder)).filter(f=>f.endsWith('.json')).map(file=>({
    ...readJSON(path.join(CONTENT,folder,file)),
    slug: path.basename(file,'.json'),
  }));
}
const posts = getEntries('posts').sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
const projects = getEntries('projects').sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured)) || String(a.title).localeCompare(String(b.title)));
const featuredPost = posts.find(x=>x.featured) || posts[0];
const featuredProject = projects.find(x=>x.featured) || projects[0];
const humanDate = (d) => { try { return new Date(`${String(d).slice(0,10)}T12:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});}catch{return String(d||'');}};
const readMinutes = (body) => Math.max(2,Math.ceil(String(body||'').split(/\s+/).length / 190));
function icon(name,size=18){
 const icons={arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',diagonal:'<path d="M7 17 17 7M8 7h9v9"/>',chev:'<path d="m9 18 6-6-6-6"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',grid:'<rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/>'};
 return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.arrow}</svg>`;
}
const linkPost = p => `/blog/${encodeURIComponent(p.slug)}/`;
const linkProject = p => `/projects/${encodeURIComponent(p.slug)}/`;
const tag = (t) => `<span class="eyebrow"><span class="kicker-square" aria-hidden="true"></span>${safeText(t)}</span>`;
function header(active='home'){
 const menu=[['Overview','/','home'],['Projects','/projects/','projects'],['Journal','/blog/','blog'],['About','/about/','about']].map(([name,url,key])=>`<a href="${url}" ${key===active?'aria-current="page"':''}>${name}</a>`).join('');
 return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="wrap nav-wrap"><a href="/" class="brand brand-wordmark" aria-label="${safeText(site.site_title)} homepage"><span class="brand-name">${safeText(site.site_title)}<small>PROJECTS & JOURNAL</small></span></a><nav class="site-nav" id="site-nav" aria-label="Primary navigation">${menu}</nav><div class="nav-end"><a class="nav-contact" href="/projects/">View portfolio ${icon('diagonal',15)}</a><button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav">${icon('menu',22)}</button></div></div></header>`;
}
function footer(){
 const email = site.contact_email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(site.contact_email) ? `<a href="mailto:${safeText(site.contact_email)}">Email ${icon('diagonal',14)}</a>` : '';
 const github = site.github_url && safeUrl(site.github_url,'') ? `<a href="${safeUrl(site.github_url)}" rel="noopener noreferrer" target="_blank">GitHub ${icon('diagonal',14)}</a>` : '';
 return `<footer class="footer"><div class="wrap footer-main"><div class="footer-identity"><p class="footer-label">INDEPENDENT WORK, OPENLY SHARED.</p><a class="footer-logo" href="/">${safeText(site.site_title)}<span class="footer-wordmark-dot">.</span></a><p>${safeText(site.footer_note||'A record of projects and ideas.')}</p></div><div class="footer-links"><div><span>Explore</span><a href="/projects/">Projects</a><a href="/blog/">Journal</a><a href="/about/">About</a></div><div><span>Connect</span>${email}${github}<a href="/">Back to top ↑</a></div></div></div><div class="wrap footer-bottom"><span>© ${new Date().getFullYear()} ${safeText(site.site_title)}. All rights reserved.</span><span>Made to grow with the work.</span></div></footer>`;
}
function page(title,description,body,active='home',cover=''){
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f8f8f6"><meta name="description" content="${safeText(description || site.site_description)}"><meta property="og:type" content="website"><meta property="og:title" content="${safeText(title)}"><meta property="og:description" content="${safeText(description||site.site_description)}">${cover?`<meta property="og:image" content="${safeUrl(cover)}">`:''}<title>${safeText(title)} — ${safeText(site.site_title)}</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"><script src="/assets/site.js" defer></script></head><body>${header(active)}<main id="main">${body}</main>${footer()}</body></html>`;
}
function projectCard(p, idx=0){
 return `<a class="project-card" href="${linkProject(p)}"><div class="project-cover">${img(p.cover,p.title)}<span class="project-number">PROJECT / ${String(idx+1).padStart(2,'0')}</span></div><div class="project-info"><div class="project-info-top"><span>${safeText(p.category||'Project')}</span><span class="project-status">${safeText(p.status||'Ongoing')}</span></div><div class="project-title-row"><h3>${safeText(p.title)}</h3><span class="arrow-circle">${icon('diagonal',18)}</span></div><p>${safeText(p.description||p.subtitle||'')}</p></div></a>`;
}
function postRow(p,idx=0){
 return `<a class="post-row article-card" href="${linkPost(p)}" data-category="${safeText((p.category||'').toLowerCase())}" data-search="${safeText([p.title,p.summary,p.category].join(' ').toLowerCase())}"><div class="post-row-index">${String(idx+1).padStart(2,'0')}</div><div class="post-row-image">${img(p.cover,p.title)}</div><div class="post-row-body"><div class="article-meta"><span>${safeText(p.category||'Journal')}</span><span class="dot-divider">·</span><time datetime="${safeText(p.date||'')}">${humanDate(p.date)}</time></div><h3>${safeText(p.title)}</h3><p>${safeText(p.summary||'')}</p></div><span class="row-arrow">${icon('diagonal',20)}</span></a>`;
}
function home(){
 const focus = featuredProject;
 const hero = `<section class="hero wrap"><div class="hero-left">${tag(site.eyebrow||'PERSONAL PORTFOLIO & JOURNAL')}<h1>${safeText(site.hero_title||'A place for the things I make.')}</h1><p>${safeText(site.hero_description||'Selected work, process and ideas.')}</p><div class="hero-actions"><a href="/projects/" class="button button-primary">Explore projects ${icon('arrow',19)}</a><a href="/blog/" class="button button-outline">Read the journal ${icon('diagonal',16)}</a></div><div class="hero-smallprint"><span class="line-mark"></span><span>INDEPENDENT WORK / UPDATED AS I GO</span></div></div><div class="hero-right"><div class="focus-heading"><span>IN FOCUS</span><span>01 — FEATURED PROJECT</span></div>${focus?`<a href="${linkProject(focus)}" class="focus-card"><div class="focus-image">${img(focus.cover,focus.title)}</div><div class="focus-footer"><div><small>${safeText(focus.category||'Selected project')} / ${safeText(focus.status||'Ongoing')}</small><strong>${safeText(focus.title)}</strong></div><span>${icon('diagonal',20)}</span></div></a>`:`<a href="/projects/" class="focus-empty">Add a featured project in Pages CMS →</a>`}</div></section>`;
 const meta = `<div class="intro-strip"><div class="wrap strip-inner"><span>WORK IN PROGRESS, DOCUMENTED.</span><div><span><b>${String(projects.length).padStart(2,'0')}</b> projects</span><i></i><span><b>${String(posts.length).padStart(2,'0')}</b> journal entries</span></div></div></div>`;
 const selected = `<section class="section wrap"><div class="section-title"><div>${tag('SELECTED WORK')}<h2>Projects <em>& explorations.</em></h2><p>Different ideas, one place to follow their progress.</p></div><a class="section-link" href="/projects/">All projects ${icon('diagonal',17)}</a></div><div class="project-grid">${projects.slice(0,4).map((p,i)=>projectCard(p,i)).join('')}</div></section>`;
 const articles = `<section class="section section-journal"><div class="wrap"><div class="section-title"><div>${tag('THE JOURNAL')}<h2>Notes <em>from the process.</em></h2><p>Progress updates, observations and things worth remembering.</p></div><a class="section-link" href="/blog/">All writing ${icon('diagonal',17)}</a></div><div class="journal-list">${posts.slice(0,3).map((p,i)=>postRow(p,i)).join('')}</div></div></section>`;
 const closing = `<section class="wrap closing-section"><div class="closing-pane"><div>${tag('A LITTLE CONTEXT')}<h2>A portfolio that grows<br>alongside the work.</h2></div><div><p>This space collects what I'm building and what I learn along the way — from longer-term products to small ideas worth testing.</p><a class="text-button" href="/about/">More about this space ${icon('diagonal',17)}</a></div></div></section>`;
 return page('Home',site.site_description,hero+meta+selected+articles+closing);
}
function indexHero(kicker,title,description,number){return `<section class="index-hero wrap"><div>${tag(kicker)}<h1>${title}</h1><p>${description}</p></div><div class="index-mark">${number}<span>/ PORTFOLIO</span></div></section>`;}
function projectIndex(){return page('Projects','Selected projects and independent work',indexHero('SELECTED WORK','Projects<span class="title-period">.</span>','A collection of things built, tested and continuously improved.','01')+`<section class="wrap index-content"><div class="project-grid project-list-grid">${projects.map((p,i)=>projectCard(p,i)).join('')}</div></section>`,'projects');}
function blogIndex(){
 const categories=[...new Set(posts.map(p=>p.category).filter(Boolean))];
 const controls=`<div class="listing-tools"><div class="filter-scroll" role="group" aria-label="Filter posts">${['All posts',...categories].map((t,i)=>`<button class="filter-pill ${i===0?'active':''}" type="button" data-filter="${safeText(i===0?'all':t.toLowerCase())}" aria-pressed="${i===0?'true':'false'}">${safeText(t)}</button>`).join('')}</div><label class="search-input">${icon('search',18)}<span class="sr-only">Search posts</span><input type="search" id="article-search" placeholder="Search articles" autocomplete="off"></label></div>`;
 return page('Journal','Articles, devlogs and project notes',indexHero('LATEST WRITING','Journal<span class="title-period">.</span>','Thoughts on the work, decisions along the way and progress worth sharing.','02')+`<section class="wrap index-content">${controls}<div id="article-grid" class="journal-list index-journal">${posts.map((p,i)=>postRow(p,i)).join('')}</div><p class="empty-result" id="no-results" hidden>No posts match your search.</p></section>`,'blog');
}
function storyByline(){return `<div class="byline"><span class="byline-mark">${icon('grid',20)}</span><div><b>${safeText(site.author_name||'Independent creator')}</b><small>Independent portfolio & journal</small></div></div>`;}
function articlePage(p){
 const related=posts.filter(x=>x.slug!==p.slug).slice(0,2);
 const body=`<div class="wrap story"><div class="breadcrumbs"><a href="/blog/">Journal</a>${icon('chev',14)}<span>${safeText(p.category||'Post')}</span></div><header class="story-header">${tag(p.category||'JOURNAL')}<h1>${safeText(p.title)}</h1><p class="story-summary">${safeText(p.summary||'')}</p><div class="story-meta">${storyByline()}<span class="story-date"><time datetime="${safeText(p.date||'')}">${humanDate(p.date)}</time> · ${readMinutes(p.body)} min read</span></div></header><div class="story-cover">${img(p.cover,p.title)}</div><div class="story-body"><article class="prose">${markdown(p.body)}</article><aside class="story-sidebar"><div class="side-heading">FROM THE JOURNAL</div><p>Continue reading</p>${related.map(r=>`<a href="${linkPost(r)}"><small>${safeText(r.category||'Journal')} · ${humanDate(r.date)}</small><b>${safeText(r.title)}</b>${icon('diagonal',15)}</a>`).join('')}</aside></div><div class="story-bottom"><a href="/blog/">← All journal entries</a><a href="/projects/">View projects ${icon('arrow',17)}</a></div></div>`;
 return page(p.title,p.summary,body,'blog',p.cover);
}
function projectPage(p){
 const ext=safeUrl(p.website_url||'','');
 const website=ext && /^https?:\/\//i.test(ext)?`<a class="button button-primary" href="${ext}" target="_blank" rel="noopener noreferrer">Open project ${icon('diagonal',16)}</a>`:'';
 const body=`<div class="wrap story"><div class="breadcrumbs"><a href="/projects/">Projects</a>${icon('chev',14)}<span>${safeText(p.title)}</span></div><header class="story-header project-header">${tag(p.category||'PROJECT')}<h1>${safeText(p.title)}</h1><p class="story-summary">${safeText(p.description||p.subtitle||'')}</p><div class="project-quickfacts"><div><small>PROJECT TYPE</small><b>${safeText(p.category||'Project')}</b></div><div><small>STATUS</small><b>${safeText(p.status||'Ongoing')}</b></div></div>${website}</header><div class="story-cover">${img(p.cover,p.title)}</div><div class="story-body"><article class="prose">${markdown(p.body)}</article><aside class="story-sidebar"><div class="side-heading">ABOUT THIS PROJECT</div><p>${safeText(p.subtitle||p.title)}</p><dl><dt>Category</dt><dd>${safeText(p.category||'Project')}</dd><dt>Status</dt><dd>${safeText(p.status||'Ongoing')}</dd></dl><a class="side-more" href="/projects/">See all projects ${icon('arrow',16)}</a></aside></div><div class="story-bottom"><a href="/projects/">← All projects</a><a href="/blog/">Read the journal ${icon('arrow',17)}</a></div></div>`;
 return page(p.title,p.description,body,'projects',p.cover);
}
function aboutPage(){
 const mail=site.contact_email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(site.contact_email)?`<a class="button button-primary" href="mailto:${safeText(site.contact_email)}">Get in touch ${icon('diagonal',16)}</a>`:`<a class="button button-primary" href="/projects/">Browse my work ${icon('arrow',17)}</a>`;
 const body=indexHero('INTRODUCTION','About<span class="title-period">.</span>','The person and ideas behind this collection of work.','03')+`<section class="wrap about-layout"><div class="about-art"><div class="about-art-inner"><div class="about-art-lines"></div><div class="about-art-shape">+</div><div class="about-art-caption">STAY CURIOUS / KEEP MAKING</div></div></div><div class="about-content">${tag('HELLO THERE')}<h2>${safeText(site.author_name||'Independent creator')}</h2><div class="prose">${markdown(site.author_bio)}</div><p>This portfolio is a quiet space for the work itself: projects, process, articles and new directions as they take shape.</p>${mail}</div></section>`;
 return page('About','About this portfolio and its creator',body,'about');
}
function writePage(url,content){const dest=path.join(DIST,url.replace(/^\//,''),'index.html');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content,'utf8');}
fs.rmSync(DIST,{recursive:true,force:true});fs.mkdirSync(DIST,{recursive:true});fs.cpSync(PUBLIC,DIST,{recursive:true});
writePage('/',home());writePage('/blog/',blogIndex());writePage('/projects/',projectIndex());writePage('/about/',aboutPage());
for(const p of posts)writePage(linkPost(p),articlePage(p));for(const p of projects)writePage(linkProject(p),projectPage(p));
fs.writeFileSync(path.join(DIST,'404.html'),page('Page not found','Page not found',`<section class="wrap not-found">${tag('404 / NOT FOUND')}<h1>This page isn’t here.</h1><p>Try the homepage or browse recent work instead.</p><a class="button button-primary" href="/">Back to homepage ${icon('arrow',18)}</a></section>`));
fs.writeFileSync(path.join(DIST,'robots.txt'),'User-agent: *\nAllow: /\n');
console.log(`Built ${posts.length} posts, ${projects.length} projects and 4 main pages → dist/`);
