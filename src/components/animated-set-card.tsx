"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AnimatedSetCardProps = {
  children: React.ReactNode;
  className?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
};

export function AnimatedSetCard({ children, className, onContextMenu }: AnimatedSetCardProps) {
  const shadowIntensity = useMotionValue(0);
  
  const boxShadow = useTransform(
    shadowIntensity,
    [0, 1],
    [
      "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    ]
  );

  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ y: 0 }}
      whileHover={{
        y: -8,
        transition: {
          delay: 0.1,
          type: "spring",
          stiffness: 300,
          damping: 20,
        },
      }}
      onHoverStart={() => shadowIntensity.set(1)}
      onHoverEnd={() => shadowIntensity.set(0)}
      style={{
        boxShadow,
      }}
      onContextMenu={onContextMenu}
    >
      {/* Animated gradient border wrapper */}
      <div className="animated-gradient-border-wrapper">
        {/* Card content */}
        <Card className="relative bg-card border-0 shadow-none z-10">
          {children}
        </Card>
      </div>
    </motion.div>
  );
}

