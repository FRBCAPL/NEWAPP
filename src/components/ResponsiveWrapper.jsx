import React, { useRef, useLayoutEffect, useState } from "react";

export default function ResponsiveWrapper({ aspectWidth, aspectHeight, children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    function updateScale() {
      if (!ref.current) return;
      const { width, height } = ref.current.getBoundingClientRect();
      setScale(Math.min(width / aspectWidth, height / aspectHeight));
    }
    updateScale();
    const ro = new window.ResizeObserver(updateScale);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [aspectWidth, aspectHeight]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          width: aspectWidth,
          height: aspectHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0
        }}
      >
        {children}
      </div>
    </div>
  );
}
