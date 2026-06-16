import React, { useState } from "react";
import { motion } from "motion/react";

interface SciFi3DCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverFlipEnabled?: boolean;
}

export default function SciFi3DCard({
  children,
  className = "",
  delay = 0,
  hoverFlipEnabled = true
}: SciFi3DCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      // A: Entry Springy Bounce (Scale + Y bounce)
      initial={{ opacity: 0, scale: 0.3, y: 100 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{
        type: "spring",
        stiffness: 180,
        damping: 12,
        mass: 1.05,
        delay
      }}
      style={{
        perspective: 1200,
        transformStyle: "preserve-3d"
      }}
      // B: Rotates 360-degrees on hover as requested
      whileHover={hoverFlipEnabled ? {
        rotateY: 360,
        scale: 1.03,
        zIndex: 40,
        boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.45), 0 0 32px 1px rgba(59, 130, 246, 0.25)",
        transition: { duration: 1.15, ease: "easeInOut" }
      } : {
        scale: 1.025,
        y: -3,
        borderColor: "rgba(59, 130, 246, 0.55)",
        boxShadow: "0 15px 35px -5px rgba(59, 130, 246, 0.35), 0 0 16px 1px rgba(59, 130, 246, 0.15)",
        transition: { type: "spring", stiffness: 350, damping: 15 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative transform-gpu transition-all duration-300 ${className}`}
    >
      {/* Sci-Fi glowing grid scanner sweep line effect */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        {isHovered && (
          <motion.div
            initial={{ top: "-10%" }}
            animate={{ top: "110%" }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)]"
          />
        )}
      </div>
      
      {/* Card Body content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
