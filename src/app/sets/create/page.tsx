"use client";

import { useState, useRef, KeyboardEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/providers/auth-provider';
import { createFlashcardSet } from '@/services/flashcard-sets';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, PlusCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const setSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  cards: z
    .array(
      z.object({
        front: z.string().min(1, 'Front side cannot be empty'),
        back: z.string().min(1, 'Back side cannot be empty'),
      })
    )
    .min(1, 'You must have at least one card'),
});

type SetFormData = z.infer<typeof setSchema>;

export default function CreateSetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastFrontInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SetFormData>({
    resolver: zodResolver(setSchema),
    defaultValues: {
      title: '',
      cards: [{ front: '', back: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'cards',
  });

  const onSubmit = async (data: SetFormData) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to create a set.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await createFlashcardSet(user.uid, data.title, data.cards);
      toast({ title: 'Success!', description: 'Your new set has been created.' });
      router.push('/dashboard');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create set. Please try again.', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      append({ front: '', back: '' });
      setTimeout(() => {
        const nextFrontInput = document.querySelector<HTMLInputElement>(`input[name="cards.${index + 1}.front"]`);
        nextFrontInput?.focus();
      }, 0);
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-secondary/50">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">Create a New Set</CardTitle>
                <CardDescription>Give your set a title and add your flashcards below.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-8">
                    <Label htmlFor="title" className="text-lg font-semibold">Set Title</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      className="mt-2 text-xl p-4"
                      placeholder="e.g. Japanese Vocabulary"
                    />
                    {errors.title && <p className="text-destructive mt-1">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-6">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg bg-background">
                         <div className="font-bold text-lg text-muted-foreground pt-2">{index + 1}</div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`cards.${index}.front`}>Front</Label>
                            <Textarea
                              id={`cards.${index}.front`}
                              {...register(`cards.${index}.front`)}
                              placeholder="e.g. こんにちは"
                              className="mt-1 resize-none"
                            />
                            {errors.cards?.[index]?.front && <p className="text-destructive mt-1">{errors.cards[index]?.front?.message}</p>}
                          </div>
                          <div>
                            <Label htmlFor={`cards.${index}.back`}>Back</Label>
                            <Textarea
                              id={`cards.${index}.back`}
                              {...register(`cards.${index}.back`)}
                              placeholder="e.g. Hello"
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
                    onClick={() => append({ front: '', back: '' })}
                    className="mt-6"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Card
                  </Button>

                  <div className="flex justify-end mt-8">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Set
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
