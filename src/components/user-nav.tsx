"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from "@/providers/auth-provider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useRippleTransition } from "@/providers/ripple-transition-provider";
import Link from "next/link";
import { LogOut, User as UserIcon, MessageSquare } from "lucide-react";
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

export function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { triggerRipple } = useRippleTransition();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleSignOut = async () => {
    try {
      // Trigger ripple animation
      triggerRipple();
      await signOut(auth);
      // Navigate after sign out
      router.push("/");
      toast({ title: "Signed out successfully." });
    } catch (error) {
      toast({ title: "Error signing out.", variant: "destructive" });
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    if (!user) {
      toast({
        title: "not signed in",
        description: "please sign in to send feedback.",
        variant: "destructive",
      });
      return;
    }

    try {
      await fetch("https://formspree.io/f/mzzvrjyq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: feedbackMessage,
          email: user.email ?? "anonymous@user.com",
        }),
      });

      toast({
        title: "feedback sent",
        description: "thank you for your feedback!",
      });

      setFeedbackMessage('');
      setIsFeedbackOpen(false);
    } catch (error) {
      toast({
        title: "error sending feedback",
        description: "please try again later.",
        variant: "destructive",
      });
    }
  };



  if (!user) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName ?? 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>profile!</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsFeedbackOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>feedback</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleFeedbackSubmit}>
            <DialogHeader>
              <DialogTitle>submit feedback</DialogTitle>
              <DialogDescription>
                have a suggestion or bug fix request? or anything else
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="message">your message</Label>
                <Textarea
                  id="message"
                  placeholder="lmk here"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">send feedback</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
