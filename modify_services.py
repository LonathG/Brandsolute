import re

descriptions = {
    # Brand Strategy
    "Brand Positioning": "The single space you own in the market, defined sharply enough that the whole team can defend it.",
    "Brand Architecture": "How every brand, product and sub-brand in the portfolio relates to the others. One logic, not a list.",
    "Visual Identity": "The mark, the colour, the type and the rules. Consistent whether it is a billboard or a phone screen.",
    "Messaging & Narrative": "The story that explains what the business does and why it matters, in words every team can carry.",
    "Verbal Identity": "How the brand sounds in every sentence. A tone the whole team can match, not just the people who write for a living.",
    "Nomenclature": "Finding names for the company, the products and every layer between them. Ownable by you, understood by everyone.",
    "Brand Campaigns": "Ideas built to move the market and earn their place in the numbers.",
    "Brand Culture": "The internal standards and behaviours that make the external brand credible. Not decoration. The reason it holds.",
    "Brand Intelligence": "How the brand lands in market today, tracked precisely enough that the next strategic call is based on fact.",

    # Growth Marketing
    "Paid Social": "Campaigns on the platforms your buyers use, run against acquisition cost and return.",
    "Paid Search": "The moment someone searches for what you offer. The work is ensuring they find you first.",
    "SEO & AI Search": "Visibility in search results and AI answers that the right buyers trust. Earned, not paid for.",
    "Programmatic Ads": "Automated buying across display, video and the open web. Reaching the audience beyond the walled gardens.",
    "CRO": "The traffic is there. The work is ensuring more of it converts into customers.",
    "Marketing Intelligence": "What every channel earns, measured precisely. Budget follows performance, not habit.",
    "Landing Pages": "A page with one job. Built to turn the click into a conversion.",
    "Performance Creatives": "Made in batches, tested against each other, with the best ones earning more spend.",
    "A/B Test": "Structured tests that settle creative and copy decisions with evidence. Not intuition.",

    # Digital Experiences
    "Web Development": "The build behind the experience. Stable, fast, handed over with documentation your team can work from.",
    "UX/UI Design": "Screens and flows laid out until the journey is intuitive and the next step never needs explaining.",
    "Website Analysis & Audit": "A structural review of the site's performance, with the biggest opportunities ranked and scoped.",
    "Information Architecture": "The underlying structure of the site: where content lives and how the journey is built.",
    "CMS Development": "A content management system built with guardrails. Your team updates the site. Consistency stays.",
    "Experience Audits": "The full journey reviewed end to end. Every friction point, every drop-off, ranked by what to fix first.",
    "Booking & Conversion Flows": "The sequence between interest and commitment, built until nothing stands between them.",
    "Technical Integrations": "The connections between the site and the tools behind it. Payment, booking, CRM, analytics. Joined without manual gaps.",
    "Portals": "Logged-in spaces for customers, partners or teams. Where the ongoing relationship has a home.",

    # Data Intelligence
    "Data Infrastructure": "The layer that connects every data source into one clean, trusted view. Nothing downstream works without it.",
    "Executive Dashboards": "The business performance view that replaces the deck you build before every board meeting.",
    "Custom Dashboards": "Built for a specific team or a specific question. Not a copy of the executive view.",
    "Funnel Diagnostics": "The journey from awareness to revenue, mapped precisely. Where it accelerates and where it does not.",
    "Forecasting": "Where the business is heading, modelled on what is actually happening, not what was budgeted.",
    "Business Performance": "Revenue, margin, operations, and people in one view. The full business, not just the marketing layer.",
    "Audience & Customer Insights": "The data behind your best customers: who they are, how they buy, and what makes them stay."
}

with open("services.html", "r") as f:
    content = f.read()

# 1. Update CSS
css_pattern = re.compile(r'/\* First child \(Active\) pill.*?(?=\.w-layout-grid)', re.DOTALL)
new_css = """
    /* Hover effect without glow */
    .quick-stack .button-3:hover {
      border-color: #c2ff7e !important;
      color: #c2ff7e !important;
      background-color: rgba(194, 255, 126, 0.05) !important;
      transform: translateY(-2px) !important;
      box-shadow: none !important;
    }
    """
content = css_pattern.sub(new_css, content)

# 2. Add data-desc to buttons
def replacer(match):
    full_tag = match.group(0)
    text = match.group(2)
    # decode HTML entities if any
    text_clean = text.replace("&amp;", "&").strip()
    desc = descriptions.get(text_clean, "")
    if desc:
        desc_escaped = desc.replace('"', '&quot;')
        # add data-desc
        return f'<a href="#" class="button-3 w-button" data-desc="{desc_escaped}">{text}</a>'
    return full_tag

content = re.sub(r'<a href="#" class="button-3 w-button">(.*?)</a>', replacer, content)

# 3. Add JS snippet before </body>
js = """
<script>
document.addEventListener('DOMContentLoaded', () => {
    const stacks = document.querySelectorAll('.quick-stack');
    stacks.forEach(stack => {
        const textElement = stack.nextElementSibling;
        const buttons = stack.querySelectorAll('.button-3');
        if (buttons.length > 0 && textElement && textElement.classList.contains('industry-text')) {
            // Save original text of the first button
            const defaultText = buttons[0].getAttribute('data-desc') || textElement.innerText;
            
            buttons.forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    const desc = btn.getAttribute('data-desc');
                    if (desc) textElement.innerText = desc;
                });
                btn.addEventListener('mouseleave', () => {
                    textElement.innerText = defaultText;
                });
            });
        }
    });
});
</script>
"""

content = content.replace('</body>', js + '\n</body>')

with open("services.html", "w") as f:
    f.write(content)

print("Done")
