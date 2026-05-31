const STRAPI_URL = 'http://localhost:1337';

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
        // Fallback for unknown block types
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
    // Recursively render other block types nested within (e.g. list-item inside list)
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

window.renderStrapiBlocks = renderStrapiBlocks;
window.STRAPI_URL = STRAPI_URL;
