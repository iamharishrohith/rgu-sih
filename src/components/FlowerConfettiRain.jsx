import React, { useEffect, useRef } from 'react';

/**
 * FlowerConfettiRain: 60fps continuous gentle rain shower of flower blossoms, petals & confetti
 * - 5-Petal Sakura/Blossom Flowers
 * - Fluttering Rose & Marigold Floral Petals (with organic air drift physics)
 * - Tumbling Colorful Confetti Ribbons & Stars
 * - Continuous particle recycling with zero memory leaks & pointer-events: none
 */
export default function FlowerConfettiRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Festive & Floral Color Palette
    const flowerColors = [
      '#f43f5e', // Rose Pink
      '#fb7185', // Sakura Blossom
      '#fda4af', // Soft Pastel Pink
      '#f59e0b', // Marigold Amber
      '#fbbf24', // Golden Yellow
      '#ec4899', // Vivid Magenta
      '#a855f7', // Lavender Purple
      '#38bdf8', // Sky Blue
      '#34d399', // Spring Emerald
      '#ffffff'  // Pearl White
    ];

    const confettiColors = [
      '#ffd700', '#4f46e5', '#10b981', '#f97316', '#ec4899', '#06b6d4', '#8b5cf6'
    ];

    // Particle pool
    const particleCount = Math.min(80, Math.max(45, Math.floor(width / 22)));
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(true));
    }

    function createParticle(initial = false) {
      const types = ['flower', 'petal', 'petal', 'confetti_rect', 'confetti_circle', 'star'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const isFloral = type === 'flower' || type === 'petal';
      const color = isFloral 
        ? flowerColors[Math.floor(Math.random() * flowerColors.length)]
        : confettiColors[Math.floor(Math.random() * confettiColors.length)];

      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : -30 - Math.random() * 50,
        type: type,
        size: type === 'flower' ? Math.random() * 8 + 10 : Math.random() * 7 + 5,
        color: color,
        vy: Math.random() * 1.6 + 1.1, // gentle falling speed
        vx: (Math.random() - 0.5) * 0.7, // gentle horizontal breeze
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 3.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.04 + 0.02,
        wobbleAmp: Math.random() * 1.6 + 0.7,
        opacity: Math.random() * 0.35 + 0.65
      };
    }

    // Draw a 5-petal flower blossom
    function drawFlower(ctx, size, color) {
      const petalCount = 5;
      const petalRadius = size * 0.5;

      ctx.fillStyle = color;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i * 2 * Math.PI) / petalCount;
        const px = Math.cos(angle) * (petalRadius * 0.7);
        const py = Math.sin(angle) * (petalRadius * 0.7);

        ctx.beginPath();
        ctx.arc(px, py, petalRadius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      // Golden center core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, petalRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, petalRadius * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw an organic curved petal
    function drawPetal(ctx, size, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size * 0.8, -size * 0.5, size * 0.8, size * 0.5, 0, size);
      ctx.bezierCurveTo(-size * 0.8, size * 0.5, -size * 0.8, -size * 0.5, 0, -size);
      ctx.fill();
    }

    // Draw standard festive ribbon confetti
    function drawConfettiRect(ctx, size, color) {
      ctx.fillStyle = color;
      ctx.fillRect(-size * 0.5, -size * 0.3, size, size * 0.6);
    }

    // Draw shimmering star
    function drawStar(ctx, size, color) {
      ctx.fillStyle = color;
      const spikes = 4;
      const outer = size * 0.6;
      const inner = size * 0.2;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(0, -outer);
      for (let i = 0; i < spikes; i++) {
        let x = Math.cos(rot) * outer;
        let y = Math.sin(rot) * outer;
        ctx.lineTo(x, y);
        rot += step;

        x = Math.cos(rot) * inner;
        y = Math.sin(rot) * inner;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(0, -outer);
      ctx.closePath();
      ctx.fill();
    }

    // 60fps Animation Loop
    function render() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics update
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * p.wobbleAmp;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Reset when falls below bottom screen
        if (p.y > height + 30 || p.x < -40 || p.x > width + 40) {
          particles[i] = createParticle(false);
          continue;
        }

        // Render Particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;

        if (p.type === 'flower') {
          drawFlower(ctx, p.size, p.color);
        } else if (p.type === 'petal') {
          drawPetal(ctx, p.size, p.color);
        } else if (p.type === 'star') {
          drawStar(ctx, p.size, p.color);
        } else if (p.type === 'confetti_circle') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawConfettiRect(ctx, p.size, p.color);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="flower-confetti-rain-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9990,
        overflow: 'hidden'
      }}
      aria-hidden="true"
    />
  );
}
