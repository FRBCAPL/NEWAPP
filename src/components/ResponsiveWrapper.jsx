import React, { useRef, useEffect, useState } from "react";

export default function ResponsiveWrapper({ aspectWidth, aspectHeight, children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (!ref.current) return;
      const { width, height } = ref.current.getBoundingClientRect();
      const newScale = Math.min(width / aspectWidth, height / aspectHeight);
      setScale(newScale);
    }
    
    updateScale();
    
    // Use a simple resize listener instead of ResizeObserver for better compatibility
    const handleResize = () => {
      updateScale();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [aspectWidth, aspectHeight]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "visible"
      }}
    >
      <div
        style={{
          width: aspectWidth,
          height: aspectHeight,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          position: "absolute",
          top: "50%",
          left: "50%"
        }}
      >
        {children}
      </div>
    </div>
  );
}
