"use client"

import * as React from "react"
import { Type } from "lucide-react"
import { useSettings, FontFamily } from "@/hooks/use-settings"
import { useSoundEffects } from "@/hooks/use-sound-effects"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const FONTS: { value: FontFamily; label: string; description: string }[] = [
  { value: "poppins", label: "Poppins", description: "Clean sans-serif" },
  { value: "shantell", label: "Shantell", description: "Handwriting style" },
  { value: "dyslexia", label: "Dyslexia", description: "OpenDyslexic font" },
]

export function FontSwitcher() {
  const { settings, setFontFamily } = useSettings()
  const { handleHoverStart, handleHoverEnd, handleNavigationClick, enableSounds } = useSoundEffects()

  const handleFontChange = (font: FontFamily) => {
    enableSounds()
    handleNavigationClick()
    setFontFamily(font)
  }

  const currentFont = FONTS.find(f => f.value === settings.fontFamily) || FONTS[0]

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
          title={`Font: ${currentFont.label}`}
        >
          <Type className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">toggle font</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {FONTS.map((font) => (
          <DropdownMenuItem
            key={font.value}
            onClick={() => handleFontChange(font.value)}
            onMouseEnter={handleHoverStart}
            onMouseLeave={handleHoverEnd}
            className={settings.fontFamily === font.value ? "bg-accent" : ""}
          >
            <Type className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>{font.label}</span>
              <span className="text-xs text-muted-foreground">{font.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
