const fs = require('fs');
const path = require('path');
const https = require('https'); // Strapi is HTTPS in production
const cheerio = require('cheerio');

const STRAPI_URL = 'https://api.thebrandsolute.com';

function fetchBlogs() {
  return new Promise((resolve, reject) => {
    https.get(`${STRAPI_URL}/api/blogs?populate=*`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', err => reject(err));
  });
}

function renderStrapiBlocks(blocks) {
  if (!Array.isArray(blocks)) return '';

  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        return `<p>${renderChildren(block.children)}</p>`;
      case 'heading':
        return `<h${block.level}>${renderChildren(block.children)}</h${block.level}>`;
      case 'list':
        const tag = block.format === 'ordered' ? 'ol' : 'ul';
        return `<${tag}>${renderChildren(block.children)}</${tag}>`;
      case 'list-item':
        return `<li>${renderChildren(block.children)}</li>`;
      case 'quote':
        return `<blockquote>${renderChildren(block.children)}</blockquote>`;
      case 'image':
        if (block.image) {
          const url = block.image.url.startsWith('http') ? block.image.url : STRAPI_URL + block.image.url;
          return `<img src="${url}" alt="${block.image.alternativeText || block.image.name || ''}" style="max-width: 100%; height: auto;" />`;
        }
        return '';
      default:
        if (block.children) {
          return renderChildren(block.children);
        }
        return '';
    }
  }).join('');
}

function renderChildren(children) {
  if (!Array.isArray(children)) return '';
  return children.map(child => {
    if (child.type === 'text') {
      let text = escapeHtml(child.text);
      if (child.bold) text = `<strong>${text}</strong>`;
      if (child.italic) text = `<em>${text}</em>`;
      if (child.underline) text = `<u>${text}</u>`;
      if (child.strikethrough) text = `<s>${text}</s>`;
      if (child.code) text = `<code>${text}</code>`;
      return text;
    }
    if (child.type === 'link') {
      return `<a href="${escapeHtml(child.url)}">${renderChildren(child.children)}</a>`;
    }
    return renderStrapiBlocks([child]);
  }).join('');
}

function escapeHtml(unsafe) {
  return (unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function main() {
  try {
    const response = await fetchBlogs();
    const blogs = response.data;
    if (!blogs || blogs.length === 0) {
      console.log('No blogs found.');
      return;
    }

    const templatePath = path.join(__dirname, '../detail_blog-posts.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    for (const blog of blogs) {
      console.log(`Generating ${blog.slug}.html...`);
      const $ = cheerio.load(templateHtml);

      // 1. Update Title and Content
      $('title').text(`${blog.title} | Brandsolute`);
      $('#blog-title').text(blog.title);

      const date = new Date(blog.publishedAt).toLocaleDateString('en-GB');
      $('#blog-date').text(date);

      // Determine fallback image if coverImage is not present
      let finalImageUrl = 'images/customer-03.webp'; // default
      if (blog.coverImage?.url) {
        finalImageUrl = blog.coverImage.url.startsWith('http') ? blog.coverImage.url : STRAPI_URL + blog.coverImage.url;
      } else if (blog.content) {
        // Try to find an image in the body to use as fallback
        const firstImageBlock = blog.content.find(b => b.type === 'image');
        if (firstImageBlock && firstImageBlock.image?.url) {
          finalImageUrl = firstImageBlock.image.url.startsWith('http') ? firstImageBlock.image.url : STRAPI_URL + firstImageBlock.image.url;
        }
      }

      $('#blog-hero-image').attr('src', finalImageUrl);
      // Update Meta & OpenGraph Images
      $('meta[property="og:image"]').attr('content', finalImageUrl);
      $('meta[name="twitter:image"]').attr('content', finalImageUrl);

      // 2. Extract first paragraph for introduction and meta descriptions
      let summary = '';
      if (blog.content && Array.isArray(blog.content)) {
        const firstPara = blog.content.find(b => b.type === 'paragraph');
        if (firstPara && firstPara.children) {
          summary = firstPara.children.map(c => c.text || '').join('');
        }
      }

      if (summary) {
        $('.article-intro').text(summary).css('display', 'block');
        $('meta[name="description"]').attr('content', summary.substring(0, 160));
        $('meta[property="og:description"]').attr('content', summary.substring(0, 160));
        $('meta[name="twitter:description"]').attr('content', summary.substring(0, 160));
      }

      // Update Meta Titles
      $('meta[property="og:title"]').attr('content', blog.title);
      $('meta[name="twitter:title"]').attr('content', blog.title);

      if (blog.content) {
        // Render the full body content without stripping the first paragraph
        const htmlContent = renderStrapiBlocks(blog.content);
        $('#blog-content').html(htmlContent);
      } else {
        $('#blog-title').text('Post not found');
      }

      // 3. Generate the "Continue Reading" related blogs
      const relatedGrid = $('#related-blog-grid-container');
      const relatedEmpty = $('#related-blog-empty-state');
      let relatedCount = 0;

      for (const relatedBlog of blogs) {
        if (relatedCount >= 3) break;
        if (relatedBlog.slug === blog.slug) continue;

        const relatedImageUrl = relatedBlog.coverImage?.url
          ? (relatedBlog.coverImage.url.startsWith('http') ? relatedBlog.coverImage.url : STRAPI_URL + relatedBlog.coverImage.url)
          : 'images/customer-03.webp';

        const relatedDate = new Date(relatedBlog.publishedAt).toLocaleDateString('en-GB');

        const html = `
          <div role="listitem" class="w-dyn-item">
            <a href="post-${relatedBlog.slug}.html" class="blog-card w-inline-block">
              <div class="zoom-image-link blog-image">
                <img src="${relatedImageUrl}" alt="${relatedBlog.title}" class="zoom-image" style="width:100%; height:100%; object-fit:cover;">
              </div>
              <div class="blog-card-body">
                <div class="heading-h5">${relatedBlog.title}</div>
                <div class="blog-card-meta">
                  <div data-wf--badge-title--variant="base" class="badge-title">
                    <div class="square"></div>
                    <div class="badge-text">ARTICLE</div>
                  </div>
                  <div class="badge-text muted">${relatedDate}</div>
                </div>
              </div>
            </a>
          </div>
        `;
        relatedGrid.append(html);
        relatedCount++;
      }

      if (relatedCount === 0) {
        relatedEmpty.css('display', 'block');
      } else {
        relatedEmpty.css('display', 'none');
      }

      // 4. Strip out the original client-side script that fetches from Strapi
      $('script').each((i, el) => {
        const text = $(el).html();
        if (text && text.includes('fetch(`${window.STRAPI_URL}/api/blogs')) {
          $(el).remove(); // Remove the script block
        }
      });
      // Optionally remove the strapi-blocks script too, since it's now static
      $('script[src="js/strapi-blocks.js"]').remove();

      // Write to file in the root directory
      const outputHtml = $.html();
      fs.writeFileSync(path.join(__dirname, `../post-${blog.slug}.html`), outputHtml);
      console.log(`Success: Generated post-${blog.slug}.html`);
    }

    // --- Generate Static blog.html Index Page ---
    console.log(`Generating static blog.html...`);
    const blogIndexPath = path.join(__dirname, '../blog.html');
    let blogIndexHtml = fs.readFileSync(blogIndexPath, 'utf8');
    const $index = cheerio.load(blogIndexHtml);

    const indexGrid = $index('#blog-grid-container');
    const indexEmpty = $index('#blog-empty-state');
    
    // Clear existing static items before appending new ones
    indexGrid.empty();

    if (blogs && blogs.length > 0) {
      for (const blog of blogs) {
        const imageUrl = blog.coverImage?.url
          ? (blog.coverImage.url.startsWith('http') ? blog.coverImage.url : STRAPI_URL + blog.coverImage.url)
          : 'images/customer-03.webp';

        const date = new Date(blog.publishedAt).toLocaleDateString('en-GB');

        const html = `
          <div role="listitem" class="w-dyn-item">
            <a href="post-${blog.slug}.html" class="blog-card w-inline-block">
              <div class="zoom-image-link blog-image">
                <img src="${imageUrl}" alt="${blog.title}" class="zoom-image" style="width:100%; height:100%; object-fit:cover;">
              </div>
              <div class="blog-card-body">
                <div class="heading-h5">${blog.title}</div>
                <div class="blog-card-meta">
                  <div data-wf--badge-title--variant="base" class="badge-title">
                    <div class="square"></div>
                    <div class="badge-text">ARTICLE</div>
                  </div>
                  <div class="badge-text muted">${date}</div>
                </div>
              </div>
            </a>
          </div>
        `;
        indexGrid.append(html);
      }
      indexEmpty.css('display', 'none');
    } else {
      indexEmpty.css('display', 'block');
    }

    // Strip client-side fetch scripts
    $index('script').each((i, el) => {
      const text = $index(el).html();
      if (text && text.includes('fetch(`${window.STRAPI_URL}/api/blogs')) {
        $index(el).remove();
      }
    });

    fs.writeFileSync(blogIndexPath, $index.html());
    console.log(`Success: Generated static blog.html`);

    // --- Generate Static index.html Blog Section ---
    console.log(`Generating static index.html...`);
    const indexPath = path.join(__dirname, '../index.html');
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    const $home = cheerio.load(indexHtml);

    const homeGrid = $home('#index-blog-grid-container');
    const homeEmpty = $home('#index-blog-empty-state');
    
    // Clear existing static items before appending new ones
    homeGrid.empty();
    
    if (blogs && blogs.length > 0) {
      // index.html only shows the latest 3 blogs
      const homeBlogs = blogs.slice(0, 3);
      for (const blog of homeBlogs) {
        const imageUrl = blog.coverImage?.url
          ? (blog.coverImage.url.startsWith('http') ? blog.coverImage.url : STRAPI_URL + blog.coverImage.url)
          : 'images/customer-03.webp';
        
        const date = new Date(blog.publishedAt).toLocaleDateString('en-GB');

        const html = `
          <div role="listitem" class="w-dyn-item">
            <a href="post-${blog.slug}.html" class="blog-card w-inline-block">
              <div class="zoom-image-link blog-image">
                <img src="${imageUrl}" alt="${blog.title}" class="zoom-image" style="width:100%; height:100%; object-fit:cover;">
              </div>
              <div class="blog-card-body">
                <div class="heading-h5">${blog.title}</div>
                <div class="blog-card-meta">
                  <div data-wf--badge-title--variant="base" class="badge-title">
                    <div class="square"></div>
                    <div class="badge-text">ARTICLE</div>
                  </div>
                  <div class="badge-text muted">${date}</div>
                </div>
              </div>
            </a>
          </div>
        `;
        homeGrid.append(html);
      }
      homeEmpty.css('display', 'none');
    } else {
      homeEmpty.css('display', 'block');
    }

    // Strip client-side fetch scripts
    $home('script').each((i, el) => {
      const text = $home(el).html();
      if (text && text.includes('fetch(`${window.STRAPI_URL}/api/blogs')) {
        $home(el).remove();
      }
    });

    fs.writeFileSync(indexPath, $home.html());
    console.log(`Success: Generated static index.html`);

  } catch (error) {
    console.error('Failed to generate blogs:', error);
  }
}

main();
