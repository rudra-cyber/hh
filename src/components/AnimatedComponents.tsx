import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

// 1. High-Fidelity Animated Counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  isCurrency?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 0.8,
  prefix = "",
  suffix = "",
  decimals = 0,
  isCurrency = false
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Easing: springy cubic out
      const ease = 1 - Math.pow(1 - progress, 4);

      setCount(startValue + ease * (value - startValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  // Format currency/decimal cleanly
  const sign = isCurrency && count < 0 ? "-" : "";
  const absValue = isCurrency ? Math.abs(count) : count;
  const formattedValue = absValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <>
      {sign}
      {prefix}
      {formattedValue}
      {suffix}
    </>
  );
}

// 2. High-Performance Scroll Reveal Wrapper
interface RevealOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}

export function RevealOnScroll({
  children,
  delay = 0,
  duration = 0.7,
  yOffset = 24,
  className = ""
}: RevealOnScrollProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        type: "spring",
        stiffness: 90,
        damping: 14,
        delay,
        duration
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 3. Staggered Entrance Variants & Components
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04
    }
  }
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14
    }
  }
};

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  key?: React.Key;
}

export function StaggerContainer({ children, className = "", id }: StaggerContainerProps) {
  return (
    <motion.div
      id={id}
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  key?: React.Key;
}

export function StaggerItem({ children, className = "", id }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className} id={id}>
      {children}
    </motion.div>
  );
}

// 4. Spring physics preset values for uniform Premium Cinematic motion
export const springPresets = {
  modal: {
    type: "spring" as const,
    stiffness: 280,
    damping: 24
  },
  page: {
    type: "spring" as const,
    stiffness: 180,
    damping: 20
  },
  hover: {
    type: "spring" as const,
    stiffness: 300,
    damping: 15
  },
  cardHover: {
    scale: 1.015,
    y: -3,
    borderColor: "rgba(59, 130, 246, 0.45)",
    boxShadow: "0 12px 30px -4px rgba(37, 99, 235, 0.15), 0 0 16px 1px rgba(37, 99, 235, 0.05)"
  }
};
