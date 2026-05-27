import re

with open('Brandsolute - Globe.html', 'r', encoding='utf-8') as f:
    globe_html = f.read()

# Extract from <body> onwards
body_match = re.search(r'<div id="__bundler_thumbnail">.*', globe_html, re.IGNORECASE | re.DOTALL)
if body_match:
    globe_content = body_match.group(0)
    globe_content = re.sub(r'</body>\s*</html>', '', globe_content, flags=re.IGNORECASE).strip()
else:
    print("Could not find body in globe.html")
    exit(1)

# Now modify the bundler logic
old_logic = """        const doc = new DOMParser().parseFromString(template, 'text/html');
        document.documentElement.replaceWith(doc.documentElement);
        const dead = Array.from(document.scripts);"""

new_logic = """        const doc = new DOMParser().parseFromString(template, 'text/html');
        const container = document.getElementById('globe-container');
        document.getElementById('__bundler_thumbnail')?.remove();
        document.getElementById('__bundler_loading')?.remove();
        
        // Handle styles
        const styles = Array.from(doc.head.querySelectorAll('style'));
        styles.forEach(s => {
          let css = s.innerHTML;
          css = css.replace(/html,\\s*body\\s*\\{[^}]+\\}/gi, '');
          css = css.replace(/#root\\s*\\{\\s*position:\\s*fixed[^}]+\\}/gi, '#root { width: 100%; height: 100%; position: relative; overflow: hidden; }');
          s.innerHTML = css + '\\n* { box-shadow: none !important; background-color: transparent !important; }';
          container.appendChild(s);
        });

        // Append body children except scripts
        Array.from(doc.body.childNodes).forEach(n => {
           if(n.tagName !== 'SCRIPT') container.appendChild(n);
        });

        const dead = Array.from(doc.scripts);"""

if old_logic not in globe_content:
    print("Could not find old logic to replace")
    exit(1)

globe_content = globe_content.replace(old_logic, new_logic)

# Add control hider
old_catch = """      } catch (err) {"""
new_catch = """        setInterval(() => {
          const container = document.getElementById('globe-container');
          if(!container) return;
          container.querySelectorAll('div').forEach(el => {
            if (el.textContent && /0:\\d{2}/.test(el.textContent) && el.textContent.length < 30) {
              let p = el.parentElement;
              for(let i=0; i<3; i++) {
                if(p && window.getComputedStyle(p).display === 'flex') {
                  p.style.display = 'none';
                  p.style.opacity = '0';
                }
                if(p) p = p.parentElement;
              }
            }
          });
        }, 500);
      } catch (err) {"""

if old_catch not in globe_content:
    print("Could not find old catch to replace")
    exit(1)
globe_content = globe_content.replace(old_catch, new_catch)


# Now read index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Remove the script we injected previously
start_script = index_html.find('<script>\n    window.addEventListener(\'load\', () => {\n      const iframe = document.querySelector(\'.globe-iframe\');')
if start_script != -1:
    end_script = index_html.find('</script>', start_script) + 9
    index_html = index_html[:start_script] + index_html[end_script:]

iframe_pattern = r'<iframe src="Brandsolute - Globe\.html" class="globe-iframe" scrolling="no" title="Brandsolute Globe"></iframe>'
iframe_match = re.search(iframe_pattern, index_html)

if iframe_match:
    index_html = index_html[:iframe_match.start()] + globe_content + index_html[iframe_match.end():]
else:
    print("Could not find iframe in index.html (Regex)")
    # fallback
    iframe_str = '<iframe src="Brandsolute - Globe.html" class="globe-iframe" scrolling="no" title="Brandsolute Globe"></iframe>'
    idx = index_html.find(iframe_str)
    if idx != -1:
        index_html = index_html[:idx] + globe_content + index_html[idx + len(iframe_str):]
    else:
        print("Could not find iframe in index.html (String)")
        exit(1)

# Write back to index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

print("Successfully embedded globe into index.html")
