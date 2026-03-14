import React from 'react';
import { motion } from 'framer-motion';

// Component to create a single, realistic RBC with depth and glow
const RedBloodCell = ({ delay, duration, size, initialX, initialY, opacity, depthOffset }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, x: initialX, y: initialY }}
    animate={{
      opacity: [opacity * 0.5, opacity, opacity * 0.5],
      scale: [1, 1.05, 1], // Subtle breathing effect
      x: [initialX - depthOffset, initialX + depthOffset, initialX - depthOffset], // Floating motion
      y: [initialY + 20, initialY - 20, initialY + 20],
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut",
    }}
    className="absolute rounded-full border border-red-950 shadow-[0_0_20px_rgba(220,38,38,0.3)] bg-gradient-to-br from-red-600 to-red-950"
    style={{
      width: size,
      height: size,
      zIndex: depthOffset < 50 ? 1 : 2, // Simple depth of field
      filter: depthOffset < 50 ? 'blur(1px)' : 'none', // Blur effect for realistic depth
    }}
  >
    {/* Inner Cell Texture for Realism */}
    <div className="absolute inset-2 bg-gradient-to-br from-red-800 to-red-950 rounded-full opacity-60"></div>
  </motion.div>
);

export default function BloodCellScene() {
  // Define diverse cells for depth and realism
  const cells = [
    { delay: 0.0, duration: 12, size: "150px", initialX: 50, initialY: 50, opacity: 0.3, depthOffset: 30 },
    { delay: 2.5, duration: 10, size: "220px", initialX: 450, initialY: 150, opacity: 0.5, depthOffset: 60 },
    { delay: 5.0, duration: 14, size: "100px", initialX: 850, initialY: 50, opacity: 0.4, depthOffset: 20 },
    { delay: 1.0, duration: 9,  size: "280px", initialX: 200, initialY: 450, opacity: 0.6, depthOffset: 80 },
    { delay: 4.5, duration: 11, size: "180px", initialX: 600, initialY: 350, opacity: 0.4, depthOffset: 40 },
    { delay: 3.0, duration: 13, size: "120px", initialX: 750, initialY: 550, opacity: 0.3, depthOffset: 25 },
    { delay: 6.5, duration: 10, size: "300px", initialX: 950, initialY: 650, opacity: 0.5, depthOffset: 70 },
    { delay: 2.0, duration: 15, size: "90px",  initialX: 50,  initialY: 750, opacity: 0.2, depthOffset: 15 },
  ];

  return (
    <div className="absolute inset-0 z-0 bg-black">
      {/* Subtle Blood Stream Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,0,0,0.1)_0%,rgba(0,0,0,1)_80%)]"></div>

      {cells.map((cell, index) => (
        <RedBloodCell key={index} {...cell} />
      ))}
    </div>
  );
}