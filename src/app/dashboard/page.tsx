"use client"

import { ProtectedRoute } from "@/providers/auth-provider";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreVertical } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockSets = [
    { id: '1', title: 'Japanese Vocabulary', cardCount: 50 },
    { id: '2', title: 'React Hooks', cardCount: 12 },
    { id: '3', title: 'Organic Chemistry Reactions', cardCount: 125 },
    { id: '4', title: 'Architectural Styles', cardCount: 30 },
]

const DashboardPage = () => {
    return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen bg-secondary/50">
                <Header />
                <main className="flex-1 p-4 md:p-8 container">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">My Sets</h1>
                        <Button asChild>
                            <Link href="/sets/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Set
                            </Link>
                        </Button>
                    </div>

                    {mockSets.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {mockSets.map(set => (
                                <Card key={set.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="pr-4">{set.title}</CardTitle>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem>Share</DropdownMenuItem>
                                                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardDescription>{set.cardCount} cards</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow"></CardContent>
                                    <CardFooter>
                                        <Button className="w-full" asChild>
                                            <Link href={`/sets/${set.id}/study`}>Study</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-12 border-2 border-dashed rounded-lg">
                           <h2 className="text-2xl font-semibold mb-2">No sets yet!</h2>
                            <p className="text-muted-foreground mb-4">Get started by creating your first flashcard set.</p>
                            <Button asChild>
                                <Link href="/sets/create">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create a Set
                                </Link>
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    )
}

export default DashboardPage;
