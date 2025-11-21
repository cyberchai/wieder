"use client";

import { useAuth, ProtectedRoute } from "@/providers/auth-provider";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFlipTransition } from "@/providers/flip-transition-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Label } from "@/components/ui/label";
import { SettingsDialog } from "@/components/settings-dialog";

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { triggerFlip } = useFlipTransition();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // Trigger the reverse flashcard flip animation
            triggerFlip();
            // Navigate halfway through the flip animation
            setTimeout(() => {
                router.push("/");
                toast({ title: "Signed out successfully." });
            }, 400);
        } catch (error) {
            toast({ title: "Error signing out.", variant: "destructive" });
        }
    };

    return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen bg-secondary/50">
                <Header />
                <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-3xl font-bold tracking-tight mb-8">profile</h1>
                        <Card>
                            <CardHeader>
                                {/* <CardDescription>Your account details.</CardDescription> */}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={user?.photoURL ?? ""} alt={user?.displayName ?? "User"} />
                                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-lg font-semibold">{user?.displayName}</p>
                                        <p className="text-muted-foreground">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <SettingsDialog />
                                    <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
                                        sign out
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
