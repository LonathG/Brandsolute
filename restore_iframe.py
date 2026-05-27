import re

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# The embedded globe starts at <div id="__bundler_thumbnail"> and ends at the script that we appended
# Actually, the container is <div class="globe-container" id="globe-container">...</div>
# Let's replace the innerHTML of globe-container

start_str = '<div class="globe-container" id="globe-container">'
start_idx = index_html.find(start_str)

if start_idx != -1:
    # Find the matching closing div for globe-container
    # Since we know the structure:
    # <div class="globe-container" id="globe-container">
    #   ...
    # </div>
    # Let's just find the next </div>\n          </div>\n        </div>
    end_str = '          </div>\n        </div>\n        <div data-w-id="29bc71f8-de30-364d-0db0-88ef57d612d1"'
    end_idx = index_html.find(end_str, start_idx)
    
    if end_idx != -1:
        # We replace everything between start_idx + len(start_str) and end_idx with the iframe
        new_content = '\n              <iframe src="Brandsolute - Globe.html" class="globe-iframe" scrolling="no" title="Brandsolute Globe"></iframe>\n'
        index_html = index_html[:start_idx + len(start_str)] + new_content + index_html[end_idx:]
    else:
        print("Could not find end of globe container")
else:
    print("Could not find globe container")

# Add the script to inject transparency at the end of the body
script_to_add = """
  <script>
    window.addEventListener('load', () => {
      const iframe = document.querySelector('.globe-iframe');
      if (!iframe) return;
      const hideControls = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          if (!doc) return;
          
          const style = doc.createElement('style');
          style.innerHTML = `
            html, body, #root { background: transparent !important; background-color: transparent !important; }
            * { box-shadow: none !important; }
          `;
          doc.head.appendChild(style);

          setInterval(() => {
            doc.querySelectorAll('div').forEach(el => {
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
        } catch (e) {
          console.error('Could not access iframe to hide controls:', e);
        }
      };
      iframe.addEventListener('load', hideControls);
      hideControls();
    });
  </script>
"""

# replace </body> with script + </body>
index_html = index_html.replace('</body>', script_to_add + '\n</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

print("Restored iframe")
