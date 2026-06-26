import React from "react";
import { motion } from "motion/react";

interface Glowing3DNumberProps {
  value: number;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  forceSign?: boolean;
}

export default function Glowing3DNumber({
  value,
  isCurrency = true,
  prefix = "",
  suffix = "",
  className = "",
  size = "md",
  forceSign = true
}: Glowing3DNumberProps) {
  const isPositive = value >= 0;
  
  // Rich 3D text shadow depth representing holographic physical panels
  const textShadowValue = isPositive
    ? "0 1px 0 #075E39, 0 2px 0 #05452A, 0 3px 0 #032E1C, 0 0 10px rgba(0,250,116,0.5), 0 0 20px rgba(0,250,116,0.2)"
    : "0 1px 0 #8C1E1D, 0 2px 0 #6B1717, 0 3px 0 #4C1010, 0 0 10px rgba(255,82,82,0.5), 0 0 20px rgba(255,82,82,0.2)";

  // If forceSign is false and it's not currency, let winrate style cleanly
  const colorClass = isPositive ? "text-[#00b074]" : "text-[#ff5252]";
  
  const sizeClasses = {
    sm: "text-xs font-bold",
    md: "text-sm font-extrabold",
    lg: "text-lg md:text-xl font-extrabold",
    xl: "text-2xl md:text-3xl lg:text-4xl font-black"
  };

  const formattedVal = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const sign = forceSign ? (isPositive ? "+" : "-") : "";
  const formatted = isCurrency
    ? (forceSign ? sign : "") + prefix + formattedVal + suffix
    : sign + prefix + formattedVal + suffix;

  return (
    <motion.span
      animate={{
        scale: [1, 1.04, 1],
        filter: [
          `drop-shadow(0 0 3px ${isPositive ? 'rgba(0,176,116,0.35)' : 'rgba(255,82,82,0.35)'})`,
          `drop-shadow(0 0 12px ${isPositive ? 'rgba(0,176,116,0.8)' : 'rgba(255,82,82,0.8)'})`,
          `drop-shadow(0 0 3px ${isPositive ? 'rgba(0,176,116,0.35)' : 'rgba(255,82,82,0.35)'})`,
        ]
      }}
      transition={{
        duration: 2.3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{
        textShadow: textShadowValue,
        transformStyle: "preserve-3d",
        display: "inline-block"
      }}
      className={`font-mono tracking-tight select-none ${colorClass} ${sizeClasses[size]} ${className}`}
    >
      {formatted}
    </motion.span>
  );
}
