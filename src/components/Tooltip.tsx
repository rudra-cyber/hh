import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: -8, rotate: -2 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0, 
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 450,
                damping: 18,
                mass: 0.8
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8, 
              y: -5,
              transition: { duration: 0.15 }
            }}
            className="absolute top-full mt-2.5 z-[100] px-3 py-1.5 bg-slate-900 border border-slate-800 text-[10.5px] font-mono tracking-wide text-blue-100 rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] pointer-events-none text-center whitespace-nowrap"
          >
            {/* Soft upward pointing indicator caret */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-slate-800 rotate-45" />
            <span className="relative z-10 flex items-center space-x-1.5 font-bold uppercase">
              <span>⚡</span> <span>{content}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
