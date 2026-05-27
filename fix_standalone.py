import re

with open('Brandsolute - Globe (standalone).html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any #1E1E1E with transparent
content = content.replace('background: #1E1E1E;', 'background: transparent;')

with open('Brandsolute - Globe (standalone).html', 'w', encoding='utf-8') as f:
    f.write(content)

