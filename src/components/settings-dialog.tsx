"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Volume2, VolumeX, Eye, EyeOff } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

export function SettingsDialog() {
  const { settings, loading, toggleSound, toggleShowNameOnPublicSets } = useSettings();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your preferences and privacy settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Sound Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                {settings.soundEnabled ? (
                  <Volume2 className="h-4 w-4 mr-2" />
                ) : (
                  <VolumeX className="h-4 w-4 mr-2" />
                )}
                Sound Effects
              </CardTitle>
              <CardDescription>
                Enable or disable sound effects throughout the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-toggle" className="text-sm font-medium">
                  {settings.soundEnabled ? "Sound enabled" : "Sound muted"}
                </Label>
                <Switch
                  id="sound-toggle"
                  checked={settings.soundEnabled}
                  onCheckedChange={toggleSound}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                {settings.showNameOnPublicSets ? (
                  <Eye className="h-4 w-4 mr-2" />
                ) : (
                  <EyeOff className="h-4 w-4 mr-2" />
                )}
                Public Sets Privacy
              </CardTitle>
              <CardDescription>
                Control how your name appears on public flashcard sets.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Label htmlFor="privacy-toggle" className="text-sm font-medium">
                  {settings.showNameOnPublicSets ? "Show name on public sets" : "Show as anonymous on public sets"}
                </Label>
                <Switch
                  id="privacy-toggle"
                  checked={settings.showNameOnPublicSets}
                  onCheckedChange={toggleShowNameOnPublicSets}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </DialogContent>
    </Dialog>
  );
}
