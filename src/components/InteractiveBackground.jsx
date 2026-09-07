import React, { useEffect, useRef } from 'react';

/**
 * InteractiveBackground: Vivid, High-Contrast 60fps Constellation Canvas & Aurora Mesh
 * - Prominently visible particles with glowing neon halos (Indigo, Cyan, Violet, Emerald, Amber)
 * - Clear, high-definition laser mesh connection lines
 * - Interactive cursor gravitational web with responsive glowing threads
 * - Layered high-definition ambient aurora gradient waves
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

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 200,
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

    // Vivid Glowing Neon Colors
    const colors = [
      { r: 79, g: 70, b: 229, hex: '#4f46e5' },   // Electric Indigo
      { r: 124, g: 58, b: 237, hex: '#7c3aed' },  // Neon Purple
      { r: 6, g: 182, b: 212, hex: '#06b6d4' },   // Cyber Cyan
      { r: 16, g: 185, b: 129, hex: '#10b981' },  // Vivid Emerald
      { r: 245, g: 158, b: 11, hex: '#f59e0b' }   // Radiant Amber
    ];

    let particles = [];

    function initParticles() {
      particles = [];
      const count = Math.max(45, Math.min(85, Math.floor((width * height) / 16000)));

      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shapeType = Math.random() > 0.75 ? 'diamond' : Math.random() > 0.5 ? 'ring' : 'circle';
        
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: Math.random() * 3.5 + 2.5,
          color: color,
          shape: shapeType,
          pulseSpeed: Math.random() * 0.035 + 0.02,
          pulseVal: Math.random() * Math.PI * 2,
          alpha: Math.random() * 0.35 + 0.55,
          glowSize: Math.random() * 18 + 10
        });
      }
    }

    initParticles();

    function render() {
      ctx.clearRect(0, 0, width, height);

      const maxDist = 160;
      const maxDistSq = maxDist * maxDist;

      // 1. Draw Prominent Connecting Laser Mesh Lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.38;
            
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${particles[i].color.r}, ${particles[i].color.g}, ${particles[i].color.b}, ${lineAlpha})`;
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
        }
      }

      // 2. Draw Interactive High-Visibility Mouse Web
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        for (let i = 0; i < particles.length; i++) {
          const dx = mouse.x - particles[i].x;
          const dy = mouse.y - particles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const proximityFactor = 1 - dist / mouse.radius;
            
            // Connect prominent glowing line to mouse
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(particles[i].x, particles[i].y);
            ctx.strokeStyle = `rgba(79, 70, 229, ${proximityFactor * 0.65})`;
            ctx.lineWidth = 1.8 * proximityFactor;
            ctx.stroke();

            // Magnetic pull
            particles[i].x += (dx / dist) * proximityFactor * 0.45;
            particles[i].y += (dy / dist) * proximityFactor * 0.45;
          }
        }

        // Distinct cursor spotlight aura
        const gradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, mouse.radius * 0.85
        );
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Render Particles with Rich Glowing Halos
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > width) { p.x = width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > height) { p.y = height; p.vy *= -1; }

        p.pulseVal += p.pulseSpeed;
        const currentAlpha = Math.min(1, p.alpha + Math.sin(p.pulseVal) * 0.2);

        ctx.save();
        ctx.translate(p.x, p.y);

        // Radiant Outer Halo Glow
        const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.glowSize);
        glowGrad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 0.55})`);
        glowGrad.addColorStop(0.6, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha * 0.2})`);
        glowGrad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, p.glowSize, 0, Math.PI * 2);
        ctx.fill();

        if (p.shape === 'diamond') {
          // Sharp Futuristic Diamond Node
          ctx.rotate(p.pulseVal * 0.6);
          ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`;
          ctx.lineWidth = 1.6;
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.8)`;
          ctx.beginPath();
          ctx.moveTo(0, -p.radius * 1.6);
          ctx.lineTo(p.radius * 1.6, 0);
          ctx.lineTo(0, p.radius * 1.6);
          ctx.lineTo(-p.radius * 1.6, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (p.shape === 'ring') {
          // Double Concentric Tech Ring
          ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.9)`;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 0.65, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Crisp Solid Core Node with White Center Highlight
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI * 2);
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
      {/* Dynamic Aurora Ambient Glowing Orbs with High Vividness */}
      <div className="ambient-aurora-orb orb-indigo"></div>
      <div className="ambient-aurora-orb orb-purple"></div>
      <div className="ambient-aurora-orb orb-cyan"></div>
      <div className="ambient-aurora-orb orb-emerald"></div>

      {/* Cyber Grid Texture Overlay */}
      <div className="cyber-grid-overlay"></div>

      {/* High-definition 60fps Particle Mesh Canvas */}
      <canvas ref={canvasRef} className="interactive-bg-canvas" />
    </div>
  );
}
