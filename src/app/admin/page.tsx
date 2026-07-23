"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute, useAuth } from "@/providers/auth-provider";
import { useImpersonation } from "@/providers/impersonation-provider";
import Header from "@/components/header";
import { getAllUsers, type UserProfile } from "@/services/users";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Search,
  Eye,
  Loader2,
  Copy,
  Users as UsersIcon,
  ShieldAlert,
} from "lucide-react";

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function AdminConsole() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: realUser } = useAuth();
  const { isSuperAdmin, startImpersonation } = useImpersonation();
  const [search, setSearch] = useState("");

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "all-users"],
    queryFn: getAllUsers,
    enabled: isSuperAdmin,
    staleTime: 60 * 1000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleViewAs = (u: UserProfile) => {
    startImpersonation({
      uid: u.uid,
      email: u.email || null,
      displayName: u.displayName || null,
      photoURL: u.photoURL || null,
    });
    toast({
      title: "Now viewing as",
      description: `${u.displayName || u.email} — read-only`,
    });
    router.push("/dashboard");
  };

  const copyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    toast({ title: "Copied", description: "User ID copied to clipboard." });
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary/15">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Superadmin</h1>
              <p className="text-sm text-muted-foreground">
                Read-only impersonation — view the app as any user.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400 mb-6">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>
              Viewing as a user is strictly read-only. You cannot create, edit,
              or delete anything on their behalf.
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or user ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <UsersIcon className="h-4 w-4" />
            <span>
              {isLoading
                ? "loading users…"
                : `${filtered.length} of ${users.length} user${
                    users.length === 1 ? "" : "s"
                  }`}
            </span>
          </div>

          {/* States */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>loading users…</span>
            </div>
          ) : error ? (
            <Card className="p-8 text-center text-muted-foreground">
              Failed to load users. Check your permissions and try again.
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No users match “{search}”.
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((u) => {
                const isSelf = u.uid === realUser?.uid;
                const joinedCount =
                  (u.joinedSetIds?.length || 0) +
                  (u.joinedGroupSetIds?.length || 0);
                return (
                  <Card
                    key={u.uid}
                    className="p-3 sm:p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={u.photoURL} alt={u.displayName} />
                        <AvatarFallback>
                          {(u.displayName || u.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {u.displayName || "some user on this app"}
                          </span>
                          {isSelf && (
                            <Badge variant="secondary" className="text-[10px]">
                              you
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email || "no email"}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                          <button
                            onClick={() => copyUid(u.uid)}
                            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                            title="Copy user ID"
                          >
                            <Copy className="h-3 w-3" />
                            <span className="font-mono truncate max-w-[120px]">
                              {u.uid}
                            </span>
                          </button>
                          <span className="hidden sm:inline">
                            joined {formatDate(u.createdAt)}
                          </span>
                          <span className="hidden md:inline">
                            {joinedCount} joined set{joinedCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelf ? "outline" : "default"}
                      disabled={isSelf}
                      onClick={() => handleViewAs(u)}
                      className="flex-shrink-0"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {isSelf ? "that's you" : "view as"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { loading } = useAuth();
  const { isSuperAdmin } = useImpersonation();

  // Redirect non-superadmins away once auth has resolved.
  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, isSuperAdmin, router]);

  return (
    <ProtectedRoute>
      {loading || !isSuperAdmin ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AdminConsole />
      )}
    </ProtectedRoute>
  );
}
