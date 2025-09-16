"use client";

import { useState, useEffect, KeyboardEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/providers/auth-provider';
import { getFlashcardSet, updateFlashcardSet, type Card as CardType } from '@/services/flashcard-sets';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, PlusCircle, Loader2, ArrowLeft, X, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const setSchema = z.object({
  title: z.string().min(1, 'title is required'),
  cards: z
    .array(
      z.object({
        id: z.string(),
        front: z.string().min(1, 'front side cannot be empty'),
        back: z.string().min(1, 'back side cannot be empty'),
      })
    )
    .min(1, 'You must have at least one card'),
  shared: z.boolean(),
  tags: z.array(z.string()).optional(),
});

type SetFormData = z.infer<typeof setSchema>;

export default function EditSetPage() {
  const router = useRouter();
  const params = useParams();
  const setId = params.setId as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShared, setIsShared] = useState(false);
  
  // Tag state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  
  // Predefined tags
  const predefinedTags = [
    'tech', 'finance', 'language', 'german', 'french', 'mandarin', 'thai', 'science'
  ];

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SetFormData>({
    resolver: zodResolver(setSchema),
    defaultValues: {
      title: '',
      cards: [],
      shared: false,
      tags: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'cards',
  });

  useEffect(() => {
    if (!setId || !user) return;
    
    const fetchSet = async () => {
      const set = await getFlashcardSet(setId);
      if (set) {
        // Allow editing if: user owns the set OR set is not public (anyone can edit non-public sets)
        if (set.userId === user.uid || !set.isPublic) {
          reset({ title: set.title, cards: set.cards, shared: set.shared, tags: set.tags || [] });
          setSelectedTags(set.tags || []);
          setIsShared(set.shared);
        } else {
          toast({ title: "Error", description: "You can only edit your own sets or non-public sets.", variant: "destructive" });
          router.push('/dashboard');
        }
      } else {
        toast({ title: "Error", description: "Set not found.", variant: "destructive" });
        router.push('/dashboard');
      }
      setIsLoading(false);
    };

    fetchSet();
  }, [setId, user, reset, router, toast]);

  const onSubmit = async (data: SetFormData) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateFlashcardSet(setId, {
        title: data.title,
        cards: data.cards,
        shared: data.shared,
        tags: data.tags
      });
      toast({ title: 'yay!', description: 'your set has been updated.' });
      router.push('/dashboard');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update set. Please try again.', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      append({ id: `${Date.now()}`, front: '', back: '' });
      setTimeout(() => {
        const nextFrontInput = document.querySelector<HTMLInputElement>(`input[name="cards.${index + 1}.front"]`);
        nextFrontInput?.focus();
      }, 0);
    }
  };

  // Tag handling functions
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      const newTags = [...selectedTags, trimmedTag];
      setSelectedTags(newTags);
      setValue('tags', newTags);
      setCustomTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  const handleCustomTagSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(customTag);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen bg-secondary/50">
          <Header />
          <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Skeleton className="h-10 w-48 mb-4" />
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full mb-8" />
                  <div className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-secondary/50">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
             <Button variant="ghost" asChild className="mb-4">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                back
              </Link>
            </Button>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-3xl">edit set</CardTitle>
                    <CardDescription>modify your set&rsquo;s title and flashcards below.</CardDescription>
                  </div>
                  <Button 
                    type="submit" 
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    save changes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-8">
                    <Label htmlFor="title" className="text-lg font-semibold">set title</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      className="mt-2 text-xl p-4"
                    />
                    {errors.title && <p className="text-destructive mt-1">{errors.title.message}</p>}
                  </div>

                  {/* Tags Section */}
                  <div className="mb-8">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Tags
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Add tags to help organize and filter your sets later
                    </p>
                    
                    {/* Selected Tags */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedTags.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:bg-primary/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Predefined Tags */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Predefined tags:</Label>
                      <div className="flex flex-wrap gap-2">
                        {predefinedTags
                          .filter(tag => !selectedTags.includes(tag))
                          .map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTag(tag)}
                              className="px-3 py-1 text-sm border border-border rounded-full hover:bg-muted transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Custom Tag Input */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Add custom tag:</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a custom tag and press Enter"
                          value={customTag}
                          onChange={(e) => setCustomTag(e.target.value)}
                          onKeyDown={handleCustomTagSubmit}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addTag(customTag)}
                          disabled={!customTag.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg bg-background">
                        <div className="font-bold text-lg text-muted-foreground pt-2">{index + 1}</div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`cards.${index}.front`}>front</Label>
                            <Textarea
                              id={`cards.${index}.front`}
                              {...register(`cards.${index}.front`)}
                              className="mt-1 resize-none"
                            />
                            {errors.cards?.[index]?.front && <p className="text-destructive mt-1">{errors.cards[index]?.front?.message}</p>}
                          </div>
                          <div>
                            <Label htmlFor={`cards.${index}.back`}>back</Label>
                            <Textarea
                              id={`cards.${index}.back`}
                              {...register(`cards.${index}.back`)}
                              className="mt-1 resize-none"
                              onKeyDown={(e) => handleKeyDown(e, index)}
                            />
                            {errors.cards?.[index]?.back && <p className="text-destructive mt-1">{errors.cards[index]?.back?.message}</p>}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                          className="mt-6 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ id: `${Date.now()}`, front: '', back: '' })}
                    className="mt-6"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    add card
                  </Button>

                  <div className="flex justify-end mt-8">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      save changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}