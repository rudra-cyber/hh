import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "motion/react";

interface ParallaxWaveBackgroundProps {
  activeTheme: "midnight" | "emerald" | "neon" | "light";
}

export default function ParallaxWaveBackground({ activeTheme }: ParallaxWaveBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Springs for smooth cursor magnetism tracking
  const springConfig = { damping: 35, stiffness: 100 };
  const smoothX = useSpring(0, springConfig);
  const smoothY = useSpring(0, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { width, height, left, top } = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / (width / 2); // normalize into [-1, 1]
      const y = (e.clientY - top - height / 2) / (height / 2); // normalize into [-1, 1]
      
      smoothX.set(x);
      smoothY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [smoothX, smoothY]);

  // Determine styling based on active design preset theme templates
  const wavesColors = {
    midnight: {
      grid: "rgba(59, 130, 246, 0.04)",
      glow1: "bg-blue-600/5",
      glow2: "bg-indigo-600/5",
      laser: "stroke-blue-500/15"
    },
    emerald: {
      grid: "rgba(16, 185, 129, 0.03)",
      glow1: "bg-emerald-600/4",
      glow2: "bg-teal-600/4",
      laser: "stroke-emerald-500/10"
    },
    neon: {
      grid: "rgba(236, 72, 153, 0.04)",
      glow1: "bg-pink-600/5",
      glow2: "bg-indigo-500/5",
      laser: "stroke-pink-500/15"
    },
    light: {
      grid: "rgba(148, 163, 184, 0.03)",
      glow1: "bg-[#e2e8f0]/30",
      glow2: "bg-blue-400/2",
      laser: "stroke-blue-400/5"
    }
  }[activeTheme];

  const [springValues, setSpringValues] = useState({ x: 0, y: 0 });

  // Update structural positions on bounce triggers
  useEffect(() => {
    const unsubscribeX = smoothX.on("change", (val) => {
      setSpringValues((prev) => ({ ...prev, x: val }));
    });
    const unsubscribeY = smoothY.on("change", (val) => {
      setSpringValues((prev) => ({ ...prev, y: val }));
    });
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [smoothX, smoothY]);

  // Translate vectors
  const translateLow = {
    x: springValues.x * -20,
    y: springValues.y * -20
  };
  const translateMid = {
    x: springValues.x * -42,
    y: springValues.y * -42
  };
  const translateHigh = {
    x: springValues.x * -80,
    y: springValues.y * -80
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none"
    >
      {/* Depth Layer 1: background neon blur emitters */}
      <motion.div
        style={{
          x: translateHigh.x,
          y: translateHigh.y,
        }}
        className={`absolute w-[500px] h-[500px] rounded-full blur-[110px] -top-40 -left-40 ${wavesColors.glow1} mix-blend-screen opacity-70`}
      />
      
      <motion.div
        style={{
          x: translateMid.x,
          y: translateLow.y,
        }}
        className={`absolute w-[600px] h-[600px] rounded-full blur-[130px] bottom-1/4 right-0 ${wavesColors.glow2} mix-blend-screen opacity-65`}
      />

      {/* Depth Layer 2: cybernetic structural space coordinate dots */}
      <motion.div
        style={{
          x: translateLow.x * 0.4,
          y: translateLow.y * 0.4,
          backgroundImage: `radial-gradient(${wavesColors.grid} 1.5px, transparent 1.5px)`,
          backgroundSize: "32px 32px"
        }}
        className="absolute inset-0 opacity-90"
      />

      {/* Depth Layer 3: Interactive Parallax Sine Wave SVGs */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[280px] opacity-70 md:opacity-85 pointer-events-none"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        {/* Wave Vector Alpha */}
        <motion.path
          style={{
            x: translateLow.x,
            y: translateLow.y * 1.3,
          }}
          className={`${wavesColors.laser} fill-none stroke-[1.5]`}
          d="M0,160 C320,300 480,40 800,200 C1120,360 1280,120 1440,180"
        />

        {/* Wave Vector Beta */}
        <motion.path
          style={{
            x: translateMid.x * 1.2,
            y: translateMid.y * -0.6,
          }}
          className={`${wavesColors.laser} fill-none stroke-[2]`}
          d="M0,100 C240,60 480,260 720,140 C960,20 1200,240 1440,120"
        />

        {/* Wave Vector Theta (Dashed lines to look techy) */}
        <motion.path
          style={{
            x: translateHigh.x * 0.5,
            y: translateHigh.y * 1.0,
          }}
          className={`${wavesColors.laser} fill-none stroke-[1]`}
          strokeDasharray="5,6"
          d="M0,220 C180,150 360,280 540,240 C720,200 900,100 1080,150 C1260,200 1350,260 1440,230"
        />
      </svg>
    </div>
  );
}
