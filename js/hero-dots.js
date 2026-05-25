document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".wide-section-content.hero-2");
  const canvas = document.getElementById("hero-dots-canvas");
  if (!container || !canvas) return;

  const ctx = canvas.getContext("2d");

  let dots = [];
  const spacing = 36; // spacing between dots in pixels
  const baseRadius = 1.0; // base radius of the dots
  const maxInfluenceRadius = 150; // mouse proximity hover influence radius
  const maxOpacity = 0.85; // maximum opacity of dot on hover
  const baseOpacity = 0.15; // base idle opacity of dot

  // Track mouse state
  const mouse = {
    x: null,
    y: null,
    active: false
  };

  // Helper to handle mouse coordinate mapping
  function updateMouseCoords(e) {
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }

  container.addEventListener("mousemove", updateMouseCoords);
  container.addEventListener("mouseenter", () => {
    mouse.active = true;
  });
  container.addEventListener("mouseleave", () => {
    mouse.active = false;
  });

  // Dot class representing each dot in the grid
  class Dot {
    constructor(x, y) {
      this.x = x; // original / target resting position x
      this.y = y; // original / target resting position y
      this.currentX = x; // current animated position x
      this.currentY = y; // current animated position y
      this.radius = baseRadius;
      this.opacity = baseOpacity;
      this.baseRadius = baseRadius;
      this.baseOpacity = baseOpacity;
    }

    update() {
      let targetX = this.x;
      let targetY = this.y;
      let targetRadius = this.baseRadius;
      let targetOpacity = this.baseOpacity;

      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxInfluenceRadius) {
          // Quadratic ease-out factor (goes from 1 at cursor to 0 at max influence radius)
          const factor = (maxInfluenceRadius - dist) / maxInfluenceRadius;
          const easeFactor = factor * factor;

          // Magnetic repulsion: shift dots slightly away from mouse
          // Max repulsion displacement is 12px
          const repulsionDistance = 12;
          // Pushes away from mouse: vector from mouse to dot is (-dx, -dy) normalized
          if (dist > 0) {
            targetX = this.x - (dx / dist) * easeFactor * repulsionDistance;
            targetY = this.y - (dy / dist) * easeFactor * repulsionDistance;
          }

          // Scale up dots near the cursor
          targetRadius = this.baseRadius + easeFactor * 2.2;

          // Increase opacity / glow
          targetOpacity = this.baseOpacity + easeFactor * (maxOpacity - this.baseOpacity);
        }
      }

      // Smooth inertia interpolation (lerp)
      this.currentX += (targetX - this.currentX) * 0.12;
      this.currentY += (targetY - this.currentY) * 0.12;
      this.radius += (targetRadius - this.radius) * 0.12;
      this.opacity += (targetOpacity - this.opacity) * 0.12;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.currentX, this.currentY, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.fill();
    }
  }

  // Initialize dots array to form a centered grid
  function initDots(width, height) {
    dots = [];
    const cols = Math.floor(width / spacing);
    const rows = Math.floor(height / spacing);

    // Calculate offsets to center the grid of dots in the canvas
    const offsetX = (width - (cols - 1) * spacing) / 2;
    const offsetY = (height - (rows - 1) * spacing) / 2;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = offsetX + c * spacing;
        const y = offsetY + r * spacing;
        dots.push(new Dot(x, y));
      }
    }
  }

  // Handle high-DPI (Retina) scaling and resizing
  function resize() {
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas dimensions scaled by DPR
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Set display size of canvas
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // Scale drawing context to match DPR
    ctx.scale(dpr, dpr);

    initDots(width, height);
  }

  // Hook resize handler
  let resizeTimeout;
  window.addEventListener("resize", () => {
    // Debounce resize to prevent stuttering
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 100);
  });

  // Set initial dimensions
  resize();

  // Core animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < dots.length; i++) {
      dots[i].update();
      dots[i].draw();
    }

    requestAnimationFrame(animate);
  }

  // Start animation loop
  requestAnimationFrame(animate);
});
