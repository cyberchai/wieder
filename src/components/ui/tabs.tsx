"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const tabsRef = React.useRef<HTMLDivElement>(null)
  const [underlineStyle, setUnderlineStyle] = React.useState({ left: 0, width: 0 })

  const updateUnderline = React.useCallback(() => {
    if (tabsRef.current) {
      const activeTrigger = tabsRef.current.querySelector('[data-state="active"]') as HTMLElement
      if (activeTrigger) {
        const rect = activeTrigger.getBoundingClientRect()
        const containerRect = tabsRef.current.getBoundingClientRect()
        setUnderlineStyle({
          left: rect.left - containerRect.left,
          width: rect.width
        })
      }
    }
  }, [])

  // Update underline position when active tab changes
  React.useEffect(() => {
    updateUnderline()
    
    // Watch for changes in the DOM
    const observer = new MutationObserver(() => {
      updateUnderline()
    })
    
    if (tabsRef.current) {
      observer.observe(tabsRef.current, {
        attributes: true,
        attributeFilter: ['data-state'],
        subtree: true,
        childList: false,
      })
    }
    
    // Also update on resize
    window.addEventListener('resize', updateUnderline)
    
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateUnderline)
    }
  }, [updateUnderline])

  return (
    <TabsPrimitive.List
      ref={(node) => {
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
        tabsRef.current = node
      }}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md tab-bar-bg p-1 text-muted-foreground relative",
        className
      )}
      {...props}
    >
      {props.children}
      <motion.div
        layoutId="activeTab"
        className="absolute bottom-0 bg-primary"
        initial={false}
        animate={{
          left: underlineStyle.left,
          width: underlineStyle.width,
        }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 25,
          mass: 0.8,
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          height: '2px',
        }}
      />
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative",
        "transition-colors duration-500 ease-in-out",
        "data-[state=active]:text-primary",
        "hover:text-foreground hover:transition-colors hover:duration-500",
        "data-[state=active]:hover:text-primary",
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-left-1/4 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-right-1/4 transition-all duration-300 ease-in-out",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
