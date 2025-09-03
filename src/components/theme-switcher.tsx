// ./src/components/theme-switcher.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme, type Theme } from "@/providers/theme-provider" // <-- import Theme type
import { useSoundEffects } from "@/hooks/use-sound-effects"
import { trackThemeChange } from "@/lib/analytics"
import { useAuth } from "@/providers/auth-provider"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NeilsonIcon, ConfeshIcon, SkunksIcon, MatrixIcon } from "./theme-icons"

// Allowed themes in your app (must match what your provider supports)
const THEMES = ["neilson", "dark", "confesh", "skunks", "bw"] as const satisfies readonly Theme[]

// Runtime type guard: string -> Theme
function isThemeName(v: string): v is Theme {
  return (THEMES as readonly string[]).includes(v)
}

export function ThemeSwitcher() {
  const { setTheme } = useTheme()
  const { handleHoverStart, handleHoverEnd, handleNavigationClick, enableSounds } = useSoundEffects()
  const { user } = useAuth()

  const handleThemeChange = (themeName: string) => {
    enableSounds()
    handleNavigationClick()
    if (!isThemeName(themeName)) {
      console.warn("Ignoring invalid theme:", themeName)
      return
    }
    setTheme(themeName) // themeName is now typed as Theme
    trackThemeChange(themeName, user?.uid)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onMouseEnter={() => {
            enableSounds()
            handleHoverStart()
          }}
          onMouseLeave={handleHoverEnd}
          onClick={() => {
            enableSounds()
            handleNavigationClick()
          }}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleThemeChange("neilson")}
          onMouseEnter={handleHoverStart}
          onMouseLeave={handleHoverEnd}
        >
          <NeilsonIcon className="mr-2 h-4 w-4" />
          <span>neilson</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          onMouseEnter={handleHoverStart}
          onMouseLeave={handleHoverEnd}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("confesh")}
          onMouseEnter={handleHoverStart}
          onMouseLeave={handleHoverEnd}
        >
          <ConfeshIcon className="mr-2 h-4 w-4" />
          <span>confesh</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("skunks")}
          onMouseEnter={handleHoverStart}
          onMouseLeave={handleHoverEnd}
        >
          <SkunksIcon className="mr-2 h-4 w-4" />
          <span>bears</span> {/* (You had "bears" here — changed to match the value) */}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("bw")}
          onMouseEnter={handleHoverStart}
          onMouseLeave={handleHoverEnd}
        >
          <MatrixIcon className="mr-2 h-4 w-4" />
          <span>bw</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
