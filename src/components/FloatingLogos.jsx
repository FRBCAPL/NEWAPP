import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import bcaplLogo from "../assets/bcapl_logo.png";
import csiLogo from "../assets/csi_logo.png";
import usaplLogo from "../assets/usapl_logo.png";
import fargorateLogo from "../assets/fargorate-logo.png";

export default function FloatingLogos() {
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const logoW = 120, logoH = 120;
  // For each logo, create two configs: one normal size, one smaller
  const logoDefs = [
    { src: logo, alt: 'League Logo', color: '#e53e3e88' },
    { src: bcaplLogo, alt: 'BCAPL Logo', color: '#e53e3e66' },
    { src: csiLogo, alt: 'CSI Logo', color: '#e53e3e44' },
    { src: usaplLogo, alt: 'USAPL Logo', color: '#e53e3e33' },
    { src: fargorateLogo, alt: 'Fargorate Logo', color: '#e53e3e33' },
  ];
  const logoCount = logoDefs.length * 2;
  // Helper to generate random configs
  function generateRandomConfigs(currentPositions) {
    const t = Date.now() / 1000;
    return Array.from({length: logoCount}, (__, i) => {
      const maxRx = (vw / 2) - 70;
      const maxRy = (vh / 2) - 70;
      // More dramatic speed ranges
      const isFast = Math.random() < 0.22;
      const baseSpeed = isFast
        ? 0.08 + Math.random() * 0.15 // fast: 0.08-0.23 (wider range)
        : 0.015 + Math.random() * 0.08; // normal: 0.015-0.095 (wider range)
      
      // Multiple oscillators with different frequencies for more randomness
      const rx1 = maxRx * (0.6 + Math.random() * 0.4);
      const rx2 = maxRx * (0.2 + Math.random() * 0.3);
      const rx3 = maxRx * (0.1 + Math.random() * 0.2);
      const ry1 = maxRy * (0.6 + Math.random() * 0.4);
      const ry2 = maxRy * (0.2 + Math.random() * 0.3);
      const ry3 = maxRy * (0.1 + Math.random() * 0.2);
      
      // Much more varied frequencies for each oscillator
      const sx1 = baseSpeed * (0.5 + Math.random() * 0.8); // 0.5-1.3x base
      const sx2 = baseSpeed * (1.2 + Math.random() * 1.8); // 1.2-3.0x base
      const sx3 = baseSpeed * (2.0 + Math.random() * 2.5); // 2.0-4.5x base
      const sy1 = baseSpeed * (0.6 + Math.random() * 0.9); // 0.6-1.5x base
      const sy2 = baseSpeed * (1.4 + Math.random() * 2.0); // 1.4-3.4x base
      const sy3 = baseSpeed * (2.5 + Math.random() * 3.0); // 2.5-5.5x base
      
      // Random phases
      const phase1 = Math.random() * Math.PI * 2;
      const phase2 = Math.random() * Math.PI * 2;
      const phase3 = Math.random() * Math.PI * 2;
      
      // Use current position as new center if available
      let cx = vw / 2, cy = vh / 2;
      if (currentPositions && currentPositions[i]) {
        cx = currentPositions[i].x;
        cy = currentPositions[i].y;
      }
      
      // Random direction
      const dir = Math.random() < 0.5 ? 1 : -1;
      
      return {
        cx,
        cy,
        rx1, rx2, rx3,
        ry1, ry2, ry3,
        sx1: sx1 * dir, sx2: sx2 * dir, sx3: sx3 * dir,
        sy1: sy1 * dir, sy2: sy2 * dir, sy3: sy3 * dir,
        phase1, phase2, phase3
      };
    });
  }
  // Store configs in state (no rerandomization)
  const [randomConfigs, setRandomConfigs] = useState(() => generateRandomConfigs());
  // Track current positions imperatively
  const currentPositionsRef = useRef([]);
  // Track previous configs and blend state for parameter morphing
  const prevConfigsRef = useRef(null);
  const blendStartRef = useRef(null);
  const [blendKey, setBlendKey] = useState(0);

  useEffect(() => {
    prevConfigsRef.current = randomConfigs;
    blendStartRef.current = Date.now();
    setBlendKey(k => k + 1);
  }, [randomConfigs]);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpAngle(a, b, t) {
    // Interpolate angles correctly (wrap around 2pi)
    let diff = b - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
  }

  useEffect(() => {
    let frame;
    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpAngle(a, b, t) {
      let diff = b - a;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      return a + diff * t;
    }
    const animate = () => {
      const tNow = Date.now() / 1000;
      let blend = 1;
      if (blendStartRef.current) {
        const elapsed = (Date.now() - blendStartRef.current) / 1000;
        blend = Math.min(1, elapsed / 1.0); // 1 second blend
      }
      for (let i = 0; i < randomConfigs.length; ++i) {
        let cfg = randomConfigs[i];
        if (blend < 1 && prevConfigsRef.current && prevConfigsRef.current !== randomConfigs) {
          const oldCfg = prevConfigsRef.current[i];
          // Blend all parameters
          cfg = {
            cx: lerp(oldCfg.cx, randomConfigs[i].cx, blend),
            cy: lerp(oldCfg.cy, randomConfigs[i].cy, blend),
            rx1: lerp(oldCfg.rx1, randomConfigs[i].rx1, blend),
            rx2: lerp(oldCfg.rx2, randomConfigs[i].rx2, blend),
            rx3: lerp(oldCfg.rx3, randomConfigs[i].rx3, blend),
            ry1: lerp(oldCfg.ry1, randomConfigs[i].ry1, blend),
            ry2: lerp(oldCfg.ry2, randomConfigs[i].ry2, blend),
            ry3: lerp(oldCfg.ry3, randomConfigs[i].ry3, blend),
            sx1: lerp(oldCfg.sx1, randomConfigs[i].sx1, blend),
            sx2: lerp(oldCfg.sx2, randomConfigs[i].sx2, blend),
            sx3: lerp(oldCfg.sx3, randomConfigs[i].sx3, blend),
            sy1: lerp(oldCfg.sy1, randomConfigs[i].sy1, blend),
            sy2: lerp(oldCfg.sy2, randomConfigs[i].sy2, blend),
            sy3: lerp(oldCfg.sy3, randomConfigs[i].sy3, blend),
            phase1: lerpAngle(oldCfg.phase1, randomConfigs[i].phase1, blend),
            phase2: lerpAngle(oldCfg.phase2, randomConfigs[i].phase2, blend),
            phase3: lerpAngle(oldCfg.phase3, randomConfigs[i].phase3, blend)
          };
        }
        // Complex path with multiple oscillators
        const x = cfg.cx + 
          Math.cos(tNow * cfg.sx1 + cfg.phase1) * cfg.rx1 +
          Math.sin(tNow * cfg.sx2 + cfg.phase2) * cfg.rx2 +
          Math.cos(tNow * cfg.sx3 + cfg.phase3) * cfg.rx3;
        const y = cfg.cy + 
          Math.sin(tNow * cfg.sy1 + cfg.phase1) * cfg.ry1 +
          Math.cos(tNow * cfg.sy2 + cfg.phase2) * cfg.ry2 +
          Math.sin(tNow * cfg.sy3 + cfg.phase3) * cfg.ry3;
        const img = logoImgRefs.current[i];
        if (img) {
          img.style.left = `${x}px`;
          img.style.top = `${y}px`;
        }
        currentPositionsRef.current[i] = { x, y };
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [vw, vh, randomConfigs, blendKey]);
  // Visual configs: normal and small size for each logo
  const visualConfigs = Array.from({length: logoCount}, (_, i) => {
    const isSmall = i % 2 === 1;
    return {
      size: isSmall ? 90 : 140,
      opacity: 0.45 + Math.random() * 0.3, // 0.45-0.75 (brighter)
      shadow: 8 + Math.random() * 24
    };
  });
  // Store all logo positions in a single state array
  const [positions, setPositions] = useState(() => Array.from({length: logoCount}, (_, i) => ({ x: logoDefs[i % 5]?.cx || vw/2, y: logoDefs[i % 5]?.cy || vh/2 })));
  // Create refs for each logo image
  const logoImgRefs = useRef([]);
  useEffect(() => {
    let frame;
    const animate = () => {
      const t = Date.now() / 1000;
      randomConfigs.forEach((cfg, i) => {
        const x = cfg.cx + Math.cos(t * cfg.speed + cfg.phase) * cfg.rx;
        const y = cfg.cy + Math.sin(t * cfg.speed + cfg.phase) * cfg.ry;
        const img = logoImgRefs.current[i];
        if (img) {
          img.style.left = `${x}px`;
          img.style.top = `${y}px`;
        }
        currentPositionsRef.current[i] = { x, y };
      });
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [vw, vh, randomConfigs]);
  const logoStyle = (logo, width, opacity, filter) => ({
    position: "absolute",
    left: logo.x,
    top: logo.y,
    transform: "translate(-50%, -50%)", // no rotation
    width,
    height: "auto",
    opacity,
    zIndex: 2,
    pointerEvents: "none",
    filter
  });
  // Render two of each logo, one normal, one small
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1,
      pointerEvents: 'none',
    }}>
      {logoDefs.flatMap((def, idx) => [0,1].map(j => {
        const i = idx * 2 + j;
        const vis = visualConfigs[i];
        return (
          <img
            key={def.alt + '-' + j}
            ref={el => logoImgRefs.current[i] = el}
            src={def.src}
            alt={def.alt + (j ? ' Small' : ' Normal')}
            style={{
              position: 'absolute',
              left: '50%', // will be updated by animation
              top: '50%',  // will be updated by animation
              transform: 'translate(-50%, -50%)',
              width: vis.size,
              height: 'auto',
              opacity: vis.opacity,
              zIndex: 2,
              pointerEvents: 'none',
              filter: `drop-shadow(0 0 ${vis.shadow}px ${def.color})`
            }}
          />
        );
      }))}
    </div>
  );
} 