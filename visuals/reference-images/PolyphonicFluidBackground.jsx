import React, { useEffect, useRef } from 'react';

// ============================================================
// POLYPHONIC — ASCII FLUID BACKGROUND
// ============================================================
// Isolated fluid animation component
// Smooth, responsive ASCII noise patterns with mouse interaction
// ============================================================

export default function PolyphonicFluidBackground({ 
  // Configuration props with defaults
  fontSize = 17,
  charWidth = 10,
  charHeight = 17,
  mouseInteraction = true,
  mouseRadius = 120,
  baseSpeed = 0.12,
  className = '',
  style = {}
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const timeRef = useRef(0);

  // Track mouse position
  useEffect(() => {
    if (!mouseInteraction) return;

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseInteraction]);

  // Main fluid animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    // ASCII characters - full alphabet and numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=~<>?/\\|{}[]():;,.!-_';
    
    // Simplex noise implementation
    const grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    
    const perm = new Array(512);
    const p = [
      151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,
      69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,
      252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,
      168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,
      211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,
      216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,
      100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,
      82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
      248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,
      98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,
      238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,
      31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,
      205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
    ];
    
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    const dot3 = (g, x, y, z) => g[0]*x + g[1]*y + g[2]*z;
    
    const noise3D = (x, y, z) => {
      const F3 = 1/3, G3 = 1/6;
      const s = (x + y + z) * F3;
      const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
      const t = (i + j + k) * G3;
      const X0 = i - t, Y0 = j - t, Z0 = k - t;
      const x0 = x - X0, y0 = y - Y0, z0 = z - Z0;
      
      let i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
        else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
        else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
      } else {
        if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
        else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
        else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
      }
      
      const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2*G3, y2 = y0 - j2 + 2*G3, z2 = z0 - k2 + 2*G3;
      const x3 = x0 - 1 + 3*G3, y3 = y0 - 1 + 3*G3, z3 = z0 - 1 + 3*G3;
      
      const ii = i & 255, jj = j & 255, kk = k & 255;
      const gi0 = perm[ii + perm[jj + perm[kk]]] % 12;
      const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
      const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
      const gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;
      
      let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
      let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
      if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot3(grad3[gi0], x0, y0, z0); }
      let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
      if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot3(grad3[gi1], x1, y1, z1); }
      let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
      if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot3(grad3[gi2], x2, y2, z2); }
      let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
      if (t3 >= 0) { t3 *= t3; n3 = t3 * t3 * dot3(grad3[gi3], x3, y3, z3); }
      
      return 32 * (n0 + n1 + n2 + n3);
    };

    // Main render loop
    const render = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;

      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      const cols = Math.ceil(width / charWidth);
      const rows = Math.ceil(height / charHeight);

      ctx.font = `${fontSize}px "SF Mono", "JetBrains Mono", "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Render ASCII fluid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const pixelX = col * charWidth;
          const pixelY = row * charHeight;
          const nx = col / cols;
          const ny = row / rows;

          // Multi-octave fluid noise
          let noise = 0;
          noise += noise3D(nx * 1.5, ny * 1.5, time * baseSpeed) * 0.5;
          noise += noise3D(nx * 3, ny * 3, time * (baseSpeed * 1.67)) * 0.25;
          noise += noise3D(nx * 6, ny * 6, time * (baseSpeed * 2.92)) * 0.15;
          noise += noise3D(nx * 12, ny * 12, time * (baseSpeed * 2.08)) * 0.1;

          // Mouse ripple effect
          if (mouseInteraction) {
            const mouseDx = pixelX - mx;
            const mouseDy = pixelY - my;
            const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
            
            if (mouseDist < mouseRadius) {
              const rippleStrength = (mouseRadius - mouseDist) / mouseRadius;
              const ripple = Math.sin(mouseDist * 0.1 - time * 5) * rippleStrength * 0.35;
              noise += ripple;
              noise += rippleStrength * 0.15;
            }
          }

          const normalizedNoise = Math.max(0, Math.min(1, (noise + 1) * 0.5));
          
          // Select character based on noise value
          const charIndex = Math.floor(normalizedNoise * (chars.length - 1));
          const char = chars[Math.max(0, Math.min(chars.length - 1, charIndex))];

          // Monochromatic palette - pure grayscale
          const lightness = 8 + normalizedNoise * 35;
          const alpha = 0.5 + normalizedNoise * 0.5;

          ctx.fillStyle = `hsla(0, 0%, ${lightness}%, ${alpha})`;
          ctx.fillText(char, pixelX, pixelY);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [fontSize, charWidth, charHeight, mouseInteraction, mouseRadius, baseSpeed]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 ${className}`}
      style={{
        zIndex: 0,
        pointerEvents: 'none',
        ...style
      }}
    />
  );
}


// ============================================================
// STANDALONE HTML VERSION (for non-React usage)
// ============================================================
// Copy everything below to use without React
// ============================================================

/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Polyphonic · ASCII Fluid Background</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      min-height: 100vh; 
      background: #000; 
      overflow: hidden;
    }
    canvas { 
      position: fixed; 
      inset: 0; 
      z-index: 0; 
    }
  </style>
</head>
<body>
  <canvas id="fluidCanvas"></canvas>
  
  <script>
    const canvas = document.getElementById('fluidCanvas');
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    let time = 0;
    let mouseX = -1000, mouseY = -1000;
    
    // Configuration
    const fontSize = 17;
    const charWidth = 10;
    const charHeight = 17;
    const mouseRadius = 120;
    const baseSpeed = 0.12;
    
    // ASCII characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=~<>?/\\|{}[]():;,.!-_';
    
    // Resize handler
    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }
    resize();
    window.addEventListener('resize', resize);
    
    // Mouse tracking
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      mouseX = -1000;
      mouseY = -1000;
    });
    
    // Simplex noise
    const grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    const perm = new Array(512);
    const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    
    const dot3 = (g, x, y, z) => g[0]*x + g[1]*y + g[2]*z;
    
    function noise3D(x, y, z) {
      const F3 = 1/3, G3 = 1/6;
      const s = (x + y + z) * F3;
      const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
      const t = (i + j + k) * G3;
      const X0 = i - t, Y0 = j - t, Z0 = k - t;
      const x0 = x - X0, y0 = y - Y0, z0 = z - Z0;
      
      let i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
        else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
        else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
      } else {
        if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
        else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
        else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
      }
      
      const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2*G3, y2 = y0 - j2 + 2*G3, z2 = z0 - k2 + 2*G3;
      const x3 = x0 - 1 + 3*G3, y3 = y0 - 1 + 3*G3, z3 = z0 - 1 + 3*G3;
      
      const ii = i & 255, jj = j & 255, kk = k & 255;
      const gi0 = perm[ii + perm[jj + perm[kk]]] % 12;
      const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
      const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
      const gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;
      
      let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
      let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
      if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot3(grad3[gi0], x0, y0, z0); }
      let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
      if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot3(grad3[gi1], x1, y1, z1); }
      let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
      if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot3(grad3[gi2], x2, y2, z2); }
      let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
      if (t3 >= 0) { t3 *= t3; n3 = t3 * t3 * dot3(grad3[gi3], x3, y3, z3); }
      
      return 32 * (n0 + n1 + n2 + n3);
    }
    
    // Render loop
    function render() {
      time += 0.016;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      
      const cols = Math.ceil(width / charWidth);
      const rows = Math.ceil(height / charHeight);
      
      ctx.font = fontSize + 'px "SF Mono", "JetBrains Mono", "Fira Code", monospace';
      ctx.textBaseline = 'top';
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const pixelX = col * charWidth;
          const pixelY = row * charHeight;
          const nx = col / cols;
          const ny = row / rows;
          
          // Multi-octave noise
          let noise = 0;
          noise += noise3D(nx * 1.5, ny * 1.5, time * baseSpeed) * 0.5;
          noise += noise3D(nx * 3, ny * 3, time * baseSpeed * 1.67) * 0.25;
          noise += noise3D(nx * 6, ny * 6, time * baseSpeed * 2.92) * 0.15;
          noise += noise3D(nx * 12, ny * 12, time * baseSpeed * 2.08) * 0.1;
          
          // Mouse ripple
          const dx = pixelX - mouseX;
          const dy = pixelY - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < mouseRadius) {
            const strength = (mouseRadius - dist) / mouseRadius;
            noise += Math.sin(dist * 0.1 - time * 5) * strength * 0.35;
            noise += strength * 0.15;
          }
          
          const normalized = Math.max(0, Math.min(1, (noise + 1) * 0.5));
          const charIndex = Math.floor(normalized * (chars.length - 1));
          const char = chars[Math.max(0, Math.min(chars.length - 1, charIndex))];
          const lightness = 8 + normalized * 35;
          const alpha = 0.5 + normalized * 0.5;
          
          ctx.fillStyle = 'hsla(0, 0%, ' + lightness + '%, ' + alpha + ')';
          ctx.fillText(char, pixelX, pixelY);
        }
      }
      
      requestAnimationFrame(render);
    }
    
    render();
  </script>
</body>
</html>
*/
