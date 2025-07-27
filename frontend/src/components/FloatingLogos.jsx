import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import bcaplLogo from "../assets/bcapl_logo.png";
import csiLogo from "../assets/csi_logo.png";
import usaplLogo from "../assets/usapl_logo.png";
import fargorateLogo from "../assets/fargorate-logo.png";

export default function FloatingLogos() {
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const logoW = 120, logoH = 120;
  const [randomConfigs] = useState(() => [0,1,2,3,4].map(() => {
    const maxRx = (vw / 2) - (logoW / 2) - 10;
    const maxRy = (vh / 2) - (logoH / 2) - 10;
    const minRx = maxRx * 0.4;
    const minRy = maxRy * 0.4;
    const minSpeed = 0.08, maxSpeed = 0.12;
    return {
      cx: vw * 0.5,
      cy: vh * 0.5,
      rx1: minRx + Math.random() * (maxRx - minRx),
      rx2: minRx * 0.5 + Math.random() * (maxRx * 0.5 - minRx * 0.5),
      sx1: minSpeed + Math.random() * (maxSpeed - minSpeed),
      sx2: minSpeed + Math.random() * (maxSpeed - minSpeed),
      ry1: minRy + Math.random() * (maxRy - minRy),
      ry2: minRy * 0.5 + Math.random() * (maxRy * 0.5 - minRy * 0.5),
      sy1: minSpeed + Math.random() * (maxSpeed - minSpeed),
      sy2: minSpeed + Math.random() * (maxSpeed - minSpeed),
      phase: Math.random() * Math.PI * 2
    };
  }));
  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  function useRandomFloatingLogoPath(config) {
    const [pos, setPos] = useState({ x: config.cx, y: config.cy });
    useEffect(() => {
      let frame;
      const animate = () => {
        const t = Date.now() / 1000;
        setPos({
          x: config.cx +
            Math.cos(t * config.sx1 + config.phase) * config.rx1 +
            Math.sin(t * config.sx2 + config.phase * 1.7) * config.rx2,
          y: config.cy +
            Math.sin(t * config.sy1 + config.phase) * config.ry1 +
            Math.cos(t * config.sy2 + config.phase * 2.3) * config.ry2
        });
        frame = requestAnimationFrame(animate);
      };
      animate();
      return () => cancelAnimationFrame(frame);
    }, [config]);
    return pos;
  }
  const main = useRandomFloatingLogoPath(randomConfigs[0]);
  const bcapl = useRandomFloatingLogoPath(randomConfigs[1]);
  const csi = useRandomFloatingLogoPath(randomConfigs[2]);
  const usapl = useRandomFloatingLogoPath(randomConfigs[3]);
  const fargorate = useRandomFloatingLogoPath(randomConfigs[4]);
  const logoStyle = (logo, width, opacity, filter) => ({
    position: "absolute",
    left: logo.x,
    top: logo.y,
    transform: "translate(-50%, -50%)",
    width,
    height: "auto",
    opacity,
    zIndex: 2,
    pointerEvents: "none",
    filter
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
      <img src={logo} alt="League Logo Background" style={logoStyle(main, 150, 0.55, "drop-shadow(0 0 24px #e53e3e88)")} />
      <img src={bcaplLogo} alt="BCAPL Logo Background" style={logoStyle(bcapl, 120, 0.55, "drop-shadow(0 0 18px #e53e3e66)")} />
      <img src={csiLogo} alt="CSI Logo Background" style={logoStyle(csi, 120, 0.55, "drop-shadow(0 0 12px #e53e3e44)")} />
      <img src={usaplLogo} alt="USAPL Logo Background" style={logoStyle(usapl, 140, 0.60, "drop-shadow(0 0 10px #e53e3e33)")} />
      <img src={fargorateLogo} alt="Fargorate Logo Background" style={logoStyle(fargorate, 140, 0.60, "drop-shadow(0 0 10px #e53e3e33)")} />
    </div>
  );
} 