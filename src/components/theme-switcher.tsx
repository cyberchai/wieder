"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/theme-provider"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NeilsonIcon, ConfeshIcon, SkunksIcon } from './theme-icons';


export function ThemeSwitcher() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("neilson")}>
          <NeilsonIcon className="mr-2 h-4 w-4" />
          <span>neilson</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("confesh")}>
          <ConfeshIcon className="mr-2 h-4 w-4" />
          <span>confesh</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("skunks")}>
          <SkunksIcon className="mr-2 h-4 w-4" />
          <span>bears</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
