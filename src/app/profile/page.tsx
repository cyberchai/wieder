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
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push("/");
            toast({ title: "Signed out successfully." });
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

                                {/* <div className="space-y-2">
                                  <Label>Theme</Label>
                                  <div className="p-2 border rounded-md flex justify-between items-center">
                                      <p className="text-muted-foreground">Select your preferred theme.</p>
                                      <ThemeSwitcher />
                                  </div>
                                </div> */}
                                
                                <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
                                    sign out
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
