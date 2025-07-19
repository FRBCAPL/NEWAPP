import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import bcaplLogo from "../assets/bcapl_logo.png";
import csiLogo from "../assets/csi_logo.png";
import usaplLogo from "../assets/usapl_logo.png";
import fargorateLogo from "../assets/fargorate-logo.png";

const LOGO_IMAGES = [
  { src: logo, alt: "League Logo Background" },
  { src: bcaplLogo, alt: "BCAPL Logo Background" },
  { src: csiLogo, alt: "CSI Logo Background" },
  { src: usaplLogo, alt: "USAPL Logo Background" },
  { src: fargorateLogo, alt: "Fargorate Logo Background" },
];

function isOverlapping(logoRect, sectionRect) {
  if (!logoRect || !sectionRect) return false;
  return !(
    logoRect.right < sectionRect.left ||
    logoRect.left > sectionRect.right ||
    logoRect.bottom < sectionRect.top ||
    logoRect.top > sectionRect.bottom
  );
}

function randomLogoConfig(vw, vh, logoW, logoH) {
  const maxRx = (vw / 2) - (logoW / 2) - 10;
  const maxRy = (vh / 2) - (logoH / 2) - 10;
  const minRx = maxRx * 0.4;
  const minRy = maxRy * 0.4;
  const minSpeed = 0.06, maxSpeed = 0.18;
  const minSize = 90, maxSize = 170;
  return {
    cx: vw * (0.2 + 0.6 * Math.random()),
    cy: vh * (0.2 + 0.6 * Math.random()),
    rx1: minRx + Math.random() * (maxRx - minRx),
    rx2: minRx * 0.5 + Math.random() * (maxRx * 0.5 - minRx * 0.5),
    sx1: (Math.random() < 0.5 ? 1 : -1) * (minSpeed + Math.random() * (maxSpeed - minSpeed)),
    sx2: (Math.random() < 0.5 ? 1 : -1) * (minSpeed + Math.random() * (maxSpeed - minSpeed)),
    ry1: minRy + Math.random() * (maxRy - minRy),
    ry2: minRy * 0.5 + Math.random() * (maxRy * 0.5 - minRy * 0.5),
    sy1: (Math.random() < 0.5 ? 1 : -1) * (minSpeed + Math.random() * (maxSpeed - minSpeed)),
    sy2: (Math.random() < 0.5 ? 1 : -1) * (minSpeed + Math.random() * (maxSpeed - minSpeed)),
    phase: Math.random() * Math.PI * 2,
    baseSize: minSize + Math.random() * (maxSize - minSize),
    sizeAmp: 12 + Math.random() * 18, // amplitude for breathing
    sizeFreq: 0.2 + Math.random() * 0.25, // frequency for breathing
  };
}

export default function FloatingLogos() {
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const logoW = 120, logoH = 120;
  const LOGO_COUNT = 10;

  // Always 2 of each logo type
  const logoTypes = Array.from({ length: LOGO_COUNT }, (_, i) => i % LOGO_IMAGES.length);

  // Store configs in state
  const [logoConfigs, setLogoConfigs] = useState(() =>
    logoTypes.map(() => randomLogoConfig(window.innerWidth, window.innerHeight, logoW, logoH))
  );

  // On resize, update vw/vh and re-randomize configs
  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      setLogoConfigs(cfgs => cfgs.map(() => randomLogoConfig(window.innerWidth, window.innerHeight, logoW, logoH)));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Get section rects
  const [sectionRects, setSectionRects] = useState({});
  useEffect(() => {
    function updateRects() {
      const upcoming = document.getElementById('upcoming-matches-section');
      const news = document.getElementById('news-updates-section');
      setSectionRects({
        upcoming: upcoming ? upcoming.getBoundingClientRect() : null,
        news: news ? news.getBoundingClientRect() : null
      });
    }
    updateRects();
    window.addEventListener('resize', updateRects);
    return () => window.removeEventListener('resize', updateRects);
  }, [vw, vh]);

  function getLogoRect(logo, width, height) {
    return {
      left: logo.x - width / 2,
      right: logo.x + width / 2,
      top: logo.y - height / 2,
      bottom: logo.y + height / 2
    };
  }

  function faded(logo, width, height) {
    const logoRect = getLogoRect(logo, width, height);
    return (
      isOverlapping(logoRect, sectionRects.upcoming) ||
      isOverlapping(logoRect, sectionRects.news)
    );
  }

  // Animate positions and size, and randomize config only when off-screen
  function useFloatingLogoPath(config, i) {
    const [pos, setPos] = useState({ x: config.cx, y: config.cy, size: config.baseSize });
    const configRef = useRef(config);
    useEffect(() => { configRef.current = config; }, [config]);
    useEffect(() => {
      let frame;
      function animate() {
        const t = Date.now() / 1000;
        const cfg = configRef.current;
        const newPos = {
          x: cfg.cx +
            Math.cos(t * cfg.sx1 + cfg.phase) * cfg.rx1 +
            Math.sin(t * cfg.sx2 + cfg.phase * 1.7) * cfg.rx2,
          y: cfg.cy +
            Math.sin(t * cfg.sy1 + cfg.phase) * cfg.ry1 +
            Math.cos(t * cfg.sy2 + cfg.phase * 2.3) * cfg.ry2,
          size: cfg.baseSize + Math.sin(t * cfg.sizeFreq + cfg.phase) * cfg.sizeAmp
        };
        setPos(newPos);
        // If off-screen, randomize config
        if (
          newPos.x + newPos.size / 2 < 0 ||
          newPos.x - newPos.size / 2 > vw ||
          newPos.y + newPos.size / 2 < 0 ||
          newPos.y - newPos.size / 2 > vh
        ) {
          setLogoConfigs(cfgs => {
            const newCfgs = [...cfgs];
            newCfgs[i] = randomLogoConfig(vw, vh, logoW, logoH);
            return newCfgs;
          });
        }
        frame = requestAnimationFrame(animate);
      }
      animate();
      return () => cancelAnimationFrame(frame);
    }, [vw, vh, i]);
    return pos;
  }

  const logoStyle = (logo, width, opacity, filter, blendMode) => ({
    position: "absolute",
    left: logo.x,
    top: logo.y,
    transform: "translate(-50%, -50%)",
    width,
    height: "auto",
    opacity,
    zIndex: 2,
    pointerEvents: "none",
    filter,
    mixBlendMode: blendMode,
  });

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {logoConfigs.map((cfg, i) => {
        const pos = useFloatingLogoPath(cfg, i);
        const img = LOGO_IMAGES[logoTypes[i]];
        const width = pos.size;
        return (
          <img
            key={i}
            src={img.src}
            alt={img.alt}
            style={logoStyle(
              pos,
              width,
              1,
              "drop-shadow(0 0 24px #e53e3e88)",
              "difference"
            )}
          />
        );
      })}
    </div>
  );
} 