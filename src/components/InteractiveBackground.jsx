import React, { useEffect, useRef } from 'react';

/**
 * InteractiveBackground: High-performance 60fps canvas & ambient visual mesh
 * Features:
 * - Constellation network mesh with dynamic distance-based laser threads
 * - Mouse cursor magnetic interaction & proximity lighting
 * - Floating glowing geometric nodes (diamonds, rings, circles)
 * - Layered ambient aurora gradient orbs
 * - Optimized with requestAnimationFrame, DPR scaling & auto-resize
 */
export default function InteractiveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates tracking
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 170,
      active: false
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Particle nodes configuration
    const colors = [
      { r: 79, g: 70, b: 229 },   // Indigo (#4f46e5)
      { r: 124, g: 58, b: 237 },  // Purple (#7c3aed)
      { r: 6, g: 182, b: 212 },   // Cyan (#06b6d4)
      { r: 16, g: 185, b: 129 },  // Emerald (#10b981)
      { r: 245, g: 158, b: 11 }   // Amber (#f59e0b)
    ];

    let particles = [];

    function initParticles() {
      particles = [];
      const count = Math.max(35, Math.min(75, Math.floor((width * height) / 20000)));

      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shapeType = Math.random() > 0.82 ? 'diamond' : Math.random() > 0.65 ? 'ring' : 'circle';
        
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.65,
          vy: (Math.random() - 0.5) * 0.65,
          radius: Math.random() * 2.8 + 1.6,
          color: color,
          shape: shapeType,
          pulseSpeed: Math.random() * 0.03 + 0.015,
          pulseVal: Math.random() * Math.PI * 2,
          alpha: Math.random() * 0.35 + 0.25,
          glowSize: Math.random() * 14 + 6
        });
      }
    }

    initParticles();

    // Render loop
    function render() {
      ctx.clearRect(0, 0, width, height);

      const maxDist = 135;
      const maxDistSq = maxDist * maxDist;

      // 1. Draw Connecting Laser Mesh Lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.18;
            
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${particles[i].color.r}, ${particles[i].color.g}, ${particles[i].color.b}, ${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      // 2. Draw Interactive Mouse Cursor Web
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        for (let i = 0; i < particles.length; i++) {
          const dx = mouse.x - particles[i].x;
          const dy = mouse.y - particles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const proximityFactor = 1 - dist / mouse.radius;
            
            // Connect line to mouse
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(particles[i].x, particles[i].y);
            ctx.strokeStyle = `rgba(79, 70, 229, ${proximityFactor * 0.38})`;
            ctx.lineWidth = 1.2 * proximityFactor;
            ctx.stroke();

            // Magnetic gentle pull towards cursor
            particles[i].x += (dx / dist) * proximityFactor * 0.35;
            particles[i].y += (dy / dist) * proximityFactor * 0.35;
          }
        }

        // Soft cursor spotlight aura
        const gradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, mouse.radius * 0.9
        );
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.03)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Update & Draw Particles with Soft Glow
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundary edges
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > width) { p.x = width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > height) { p.y = height; p.vy *= -1; }

        // Pulse
        p.pulseVal += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.pulseVal) * 0.12;

        ctx.save();
        ctx.translate(p.x, p.y);

        // Draw radial glow for selected particles
        if (p.shape === 'ring' || p.shape === 'diamond') {
          const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.glowSize);
          glowGrad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 0.35})`);
          glowGrad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, p.glowSize, 0, Math.PI * 2);
          ctx.fill();
        }

        if (p.shape === 'diamond') {
          ctx.rotate(p.pulseVal * 0.5);
          ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 1.3})`;
          ctx.lineWidth = 1.2;
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(0, -p.radius * 1.5);
          ctx.lineTo(p.radius * 1.5, 0);
          ctx.lineTo(0, p.radius * 1.5);
          ctx.lineTo(-p.radius * 1.5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (p.shape === 'ring') {
          ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 1.4})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 1.4, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 1.5})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 1.2})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="interactive-bg-wrapper" aria-hidden="true">
      {/* Dynamic Aurora Ambient Glowing Orbs */}
      <div className="ambient-aurora-orb orb-indigo"></div>
      <div className="ambient-aurora-orb orb-purple"></div>
      <div className="ambient-aurora-orb orb-cyan"></div>
      <div className="ambient-aurora-orb orb-emerald"></div>

      {/* Cyber Grid Texture Overlay */}
      <div className="cyber-grid-overlay"></div>

      {/* Interactive 60fps Particle Mesh Canvas */}
      <canvas ref={canvasRef} className="interactive-bg-canvas" />
    </div>
  );
}
