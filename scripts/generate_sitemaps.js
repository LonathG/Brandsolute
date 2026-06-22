const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_URL = 'https://thebrandsolute.com';

function escapeHtml(unsafe) {
  return (unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generate() {
  console.log('Starting sitemap generation...');
  const rootDir = path.join(__dirname, '..');
  const files = fs.readdirSync(rootDir);

  // 1. Core pages configuration
  const mainPages = [
    { file: 'index.html', title: 'Home', priority: '1.0', changefreq: 'weekly' },
    { file: 'services.html', title: 'Services', priority: '0.8', changefreq: 'monthly' },
    { file: 'about.html', title: 'About Us', priority: '0.8', changefreq: 'monthly' },
    { file: 'blog.html', title: 'Blogs', priority: '0.8', changefreq: 'weekly' },
    { file: 'contact.html', title: 'Get In Touch', priority: '0.8', changefreq: 'monthly' }
  ];

  // 2. Scan for blog posts (post-*.html)
  const blogPosts = [];
  files.forEach(file => {
    if (file.startsWith('post-') && file.endsWith('.html')) {
      const filePath = path.join(rootDir, file);
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(fileContent);
        let title = $('title').text() || file;
        
        // Clean up title suffix
        title = title.replace(/\s*\|\s*Brandsolute/gi, '').trim();

        blogPosts.push({
          file: file,
          title: title,
          priority: '0.6',
          changefreq: 'monthly'
        });
      } catch (err) {
        console.error(`Error reading ${file}:`, err);
      }
    }
  });

  // Sort blog posts alphabetically by title
  blogPosts.sort((a, b) => a.title.localeCompare(b.title));

  console.log(`Found ${mainPages.length} main pages and ${blogPosts.length} blog posts.`);

  // 3. Generate sitemap.xml
  const today = new Date().toISOString().split('T')[0];
  const allUrls = [...mainPages, ...blogPosts];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  allUrls.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/${escapeHtml(page.file)}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  xml += '</urlset>\n';

  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), xml);
  console.log('sitemap.xml written successfully.');

  // 4. Generate sitemap.html
  const aboutPath = path.join(rootDir, 'about.html');
  if (!fs.existsSync(aboutPath)) {
    console.error('Error: about.html not found, cannot build styled HTML sitemap.');
    return;
  }

  const aboutHtml = fs.readFileSync(aboutPath, 'utf8');
  const $ = cheerio.load(aboutHtml);

  // Update title & metadata
  $('title').text('Sitemap | Brandsolute');
  $('meta[name="description"]').attr('content', 'Sitemap of Brandsolute. Find links to all our services, articles, and company pages.');
  $('meta[property="og:description"]').attr('content', 'Sitemap of Brandsolute. Find links to all our services, articles, and company pages.');
  $('meta[name="twitter:description"]').attr('content', 'Sitemap of Brandsolute. Find links to all our services, articles, and company pages.');
  $('meta[property="og:title"]').attr('content', 'Sitemap | Brandsolute');
  $('meta[name="twitter:title"]').attr('content', 'Sitemap | Brandsolute');

  // Clone CTA section before removing all sections
  const ctaSection = $('section:has(.cta-content)').first().clone();

  // Remove existing content sections
  $('body > section').remove();

  // Create Sitemap Section content
  const sitemapSectionHtml = `
  <section class="section top-padding-l sitemap-section" style="background-color: #0b0b0b; padding-top: 120px; padding-bottom: 80px;">
    <div class="main-container">
      <div class="vertical-content" style="margin-bottom: 48px; display: flex; flex-direction: column; gap: 16px;">
        <div data-wf--badge-title--variant="base" class="badge-title">
          <div class="square"></div>
          <div class="badge-text">Sitemap</div>
        </div>
        <h1 class="heading-h2">Website Navigation Index</h1>
        <p style="color: #B9B8B0; font-size: 16px; max-width: 600px; margin: 0;">
          Explore the absolute guide to our pages, services, and growth articles.
        </p>
      </div>

      <style>
        .sitemap-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin-bottom: 64px;
        }
        @media screen and (max-width: 767px) {
          .sitemap-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      </style>

      <div class="sitemap-grid">
        <!-- Left Column: Main Pages -->
        <div class="sitemap-column">
          <h3 class="heading-h4" style="margin-top: 0; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; color: #E1F9A7; font-family: var(--typefaces--body), sans-serif;">Main Pages</h3>
          <div class="open-positions-list">
            ${mainPages.map(page => `
              <a href="${escapeHtml(page.file)}" class="open-position-item w-inline-block">
                <div class="open-position-title">${escapeHtml(page.title)}</div>
                <div class="open-position-meta">
                  <div class="open-position-text-muted" style="margin-right: 12px;">${escapeHtml(page.file)}</div>
                  <img src="images/icon-interface-arrow-right.svg" alt="Arrow right icon" class="open-position-arrow">
                </div>
              </a>
            `).join('')}
          </div>
        </div>

        <!-- Right Column: Blog Articles -->
        <div class="sitemap-column">
          <h3 class="heading-h4" style="margin-top: 0; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; color: #E1F9A7; font-family: var(--typefaces--body), sans-serif;">Articles</h3>
          <div class="open-positions-list">
            ${blogPosts.map(post => `
              <a href="${escapeHtml(post.file)}" class="open-position-item w-inline-block">
                <div class="open-position-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</div>
                <div class="open-position-meta">
                  <div class="open-position-text-muted" style="margin-right: 12px;">${escapeHtml(post.file)}</div>
                  <img src="images/icon-interface-arrow-right.svg" alt="Arrow right icon" class="open-position-arrow">
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </section>
  `;

  // Insert Sitemap section after the navbar wrapper
  const navbar = $('div.navbar-wrapper');
  if (navbar.length > 0) {
    navbar.after(sitemapSectionHtml);
  } else {
    // Fallback if navbar class differs
    $('body').prepend(sitemapSectionHtml);
  }

  // Insert CTA section right before the footer
  const footer = $('footer.footer');
  if (footer.length > 0) {
    footer.before(ctaSection);
  } else {
    $('body').append(ctaSection);
  }

  fs.writeFileSync(path.join(rootDir, 'sitemap.html'), $.html());
  console.log('sitemap.html written successfully.');
}

generate();
