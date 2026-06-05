import re
import glob

# The new footer to inject
new_footer = """  <section class="footer"
    style="background-color: #212121; color: #fff; padding: 80px 5%; display: flex; flex-direction: column; justify-content: space-between; min-height: 80vh; font-family: inherit;">
    <div
      style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; flex-wrap: wrap; gap: 40px;">
      <div style="font-size: clamp(40px, 6vw, 80px); line-height: 1.1; font-weight: 400; letter-spacing: -0.02em;">
        Let’s explore<br>what’s next
      </div>
      <div>
        <a href="contact.html"
          style="background-color: #fff; color: #000; padding: 14px 28px; border-radius: 40px; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; display: inline-flex; align-items: center; gap: 8px; text-transform: uppercase;">
          LET'S COLLABORATE
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"
              stroke-linejoin="round"></path>
          </svg>
        </a>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; width: 100%; margin-top: auto; padding-top: 80px;">
      <div style="display: flex; justify-content: flex-end; width: 100%;">
        <img src="images/White.png" alt="Brandsolute"
          style="width: 100%; max-width: 800px; height: auto; margin-bottom: 24px; display: block;">
      </div>
      <div
        style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%; flex-wrap: wrap-reverse; gap: 40px;">
        <div
          style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #777; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">
          <a href="#" style="color: #777; text-decoration: none; transition: color 0.2s;"
            onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#777'">PRIVACY POLICY</a>
          <a href="#" style="color: #777; text-decoration: none; transition: color 0.2s;"
            onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#777'">COOKIE POLICY</a>
          <div style="margin-top: 4px;">©BRANDSOLUTE 2022-2026. ALL RIGHTS RESERVED.</div>
        </div>
        <div
          style="display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
          <a href="#"
            style="color: #999; text-decoration: none; border: 1px solid #333; padding: 8px 16px; border-radius: 20px; transition: all 0.2s;"
            onmouseover="this.style.color='#fff'; this.style.borderColor='#fff'"
            onmouseout="this.style.color='#999'; this.style.borderColor='#333'">INSTAGRAM</a>
          <a href="#"
            style="color: #999; text-decoration: none; border: 1px solid #333; padding: 8px 16px; border-radius: 20px; transition: all 0.2s;"
            onmouseover="this.style.color='#fff'; this.style.borderColor='#fff'"
            onmouseout="this.style.color='#999'; this.style.borderColor='#333'">DRIBBBLE</a>
          <a href="#"
            style="color: #999; text-decoration: none; border: 1px solid #333; padding: 8px 16px; border-radius: 20px; transition: all 0.2s;"
            onmouseover="this.style.color='#fff'; this.style.borderColor='#fff'"
            onmouseout="this.style.color='#999'; this.style.borderColor='#333'">X</a>
          <a href="#"
            style="color: #999; text-decoration: none; border: 1px solid #333; padding: 8px 16px; border-radius: 20px; transition: all 0.2s;"
            onmouseover="this.style.color='#fff'; this.style.borderColor='#fff'"
            onmouseout="this.style.color='#999'; this.style.borderColor='#333'">LINKEDIN</a>
        </div>
      </div>
    </div>
  </section>"""

files_to_update = [
    'services.html',
    'about.html',
    'blog.html',
    'detail_blog-posts.html',
    'detail_blog-categories.html',
    'detail_category.html',
    'contact.html'
]

pattern = re.compile(r'<section class="footer".*?</section>', re.DOTALL)

for f in files_to_update:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Check if it has the footer
        if re.search(pattern, content):
            new_content = re.sub(pattern, new_footer, content)
            if new_content != content:
                with open(f, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f"Updated {f}")
            else:
                print(f"No changes needed for {f}")
        else:
            print(f"Footer not found in {f}")
    except Exception as e:
        print(f"Error processing {f}: {e}")

