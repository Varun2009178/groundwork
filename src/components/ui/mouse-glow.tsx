"use client";

import { useEffect, useSyncExternalStore } from "react";
import { motion, useSpring } from "framer-motion";

const emptySubscribe = () => () => {};

export function MouseGlow() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const mouseX = useSpring(0, { damping: 25, stiffness: 80 });
  const mouseY = useSpring(0, { damping: 25, stiffness: 80 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY + window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: "transparent",
      }}
    >
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          background:
            "radial-gradient(circle, rgba(255, 180, 80, 0.03) 0%, rgba(255, 255, 255, 0.01) 40%, transparent 70%)",
          filter: "blur(10px)",
          position: "fixed",
        }}
      />
    </motion.div>
  );
}
