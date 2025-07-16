import React, { useRef, useLayoutEffect, useState } from "react";

export default function ResponsiveWrapper({ aspectWidth = 2, aspectHeight = 1, children, style = {} }) {
  const aspect = aspectWidth / aspectHeight;
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: aspect,
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
