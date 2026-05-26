document.addEventListener("DOMContentLoaded", () => {
  const canvases = document.querySelectorAll(".interactive-dots");
  canvases.forEach(canvas => {
    initCanvasDots(canvas);
  });

  function initCanvasDots(canvas) {
    const container = canvas.parentElement;
    if (!container) return;

    const ctx = canvas.getContext("2d");

    let dots = [];
    const spacing = 36; // spacing between dots in pixels
    const baseRadius = 1.0; // base radius of the dots
    const maxInfluenceRadius = 150; // mouse proximity hover influence radius
    const maxOpacity = 0.95; // maximum opacity of dot on hover
    const baseOpacity = 0.45; // base idle opacity of dot (all dots clearly visible)

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
        this.hoverFactor = 0; // smooth tracking of cursor proximity glow
      }

      update() {
        let targetX = this.x;
        let targetY = this.y;
        let targetRadius = this.baseRadius;
        let targetOpacity = this.baseOpacity;
        let targetHoverFactor = 0;

        if (mouse.active && mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxInfluenceRadius) {
            // Quadratic ease-out factor (goes from 1 at cursor to 0 at max influence radius)
            const factor = (maxInfluenceRadius - dist) / maxInfluenceRadius;
            const easeFactor = factor * factor;
            targetHoverFactor = easeFactor;

            // Magnetic repulsion: shift dots slightly away from mouse
            const repulsionDistance = 12;
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
        this.hoverFactor += (targetHoverFactor - this.hoverFactor) * 0.12;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.currentX, this.currentY, this.radius, 0, Math.PI * 2);

        // Render luminous glow effect on hover
        if (this.hoverFactor > 0.01) {
          ctx.shadowColor = 'rgba(177, 255, 164, 1)';
          ctx.shadowBlur = this.hoverFactor * 15;
        } else {
          ctx.shadowBlur = 0;
        }

        // Render dots in cyber green
        ctx.fillStyle = `rgba(177, 255, 164, ${this.opacity})`;
        ctx.fill();
        ctx.shadowBlur = 0; // reset glow for other drawings
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
      if (width === 0 || height === 0) return;
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

    // Hook resize handler using ResizeObserver to dynamically adapt to container size changes
    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize to prevent stuttering
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 50);
    });
    resizeObserver.observe(container);

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
  }

  // Handle interactive hover gradient for CTA section across all pages
  const ctaSections = document.querySelectorAll(".wide-section-content.cta");
  ctaSections.forEach(cta => {
    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;

    cta.addEventListener("mousemove", (e) => {
      const rect = cta.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 100;
      targetY = ((e.clientY - rect.top) / rect.height) * 100;
    });

    cta.addEventListener("mouseleave", () => {
      // Gently return to center when mouse leaves
      targetX = 50;
      targetY = 50;
    });

    function updateGradient() {
      // Butter smooth linear interpolation (lerp)
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      cta.style.setProperty("--mouse-x", `${currentX}%`);
      cta.style.setProperty("--mouse-y", `${currentY}%`);

      requestAnimationFrame(updateGradient);
    }
    updateGradient();
  });
});
