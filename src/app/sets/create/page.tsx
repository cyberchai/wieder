"use client";

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { createFlashcardSet } from '@/services/flashcard-sets';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, PlusCircle, Loader2, ArrowLeft, Upload, FileText, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { trackUserEngagement, trackPageView } from '@/lib/analytics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

const setSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  cards: z
    .array(
      z.object({
        front: z.string().min(1, 'front side cannot be empty'),
        back: z.string().min(1, 'back side cannot be empty'),
      })
    )
    .min(1, 'you must have at least one card'),
});

type SetFormData = z.infer<typeof setSchema>;

export default function CreateSetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Track page view
  useEffect(() => {
    if (user) {
      trackPageView('create_set', user.uid);
    }
  }, [user]);


  const {
    register,
    control,
    handleSubmit,
    setValue,
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
      toast({ title: 'Error', description: 'you must be logged in to create a set.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await createFlashcardSet(user.uid, data.title, data.cards);
      
      // Track set creation
      trackUserEngagement('create_flashcard_set', { 
        set_title: data.title,
        card_count: data.cards.length,
        action: 'create'
      }, user.uid);
      
      toast({ title: 'yay!', description: 'your new set has been created.' });
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
  
  const handleImport = () => {
    const lines = importText.split('\n').filter(line => line.trim() !== '');
    const newCards: { front: string; back: string }[] = [];
    let error = false;

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length === 2) {
        newCards.push({ front: parts[0].trim(), back: parts[1].trim() });
      } else {
        error = true;
        break;
      }
    }

    if (error) {
      toast({
        title: 'Import Error',
        description: 'please make sure each line includes a tab character separating word and definition',
        variant: 'destructive',
      });
    } else if (newCards.length > 0) {
      setValue('cards', newCards, { shouldValidate: true });
      toast({ title: 'Success!', description: `${newCards.length} cards imported.` });
      setIsImportDialogOpen(false);
      setImportText("");
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.type === 'application/pdf') {
      setUploadedFile(file);
      toast({ title: 'File uploaded!', description: `${file.name} is ready for processing.` });
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleGoogleDriveLink = () => {
    if (googleDriveLink.trim()) {
      toast({ title: 'Google Drive link added!', description: 'Link processing will be implemented soon.' });
      setGoogleDriveLink("");
    } else {
      toast({
        title: 'Invalid link',
        description: 'Please enter a valid Google Drive link.',
        variant: 'destructive',
      });
    }
  };


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
                        <CardTitle className="text-3xl">new set</CardTitle>
                        <CardDescription>give your set a title and add your flashcards below.</CardDescription>
                    </div>
                    <div className="flex gap-3">
                      {fields.length >= 5 && (
                        <Button 
                          type="submit" 
                          onClick={handleSubmit(onSubmit)}
                          disabled={isSubmitting}
                          className="min-w-[120px]"
                        >
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          create set
                        </Button>
                      )}
                      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                        <DialogTrigger asChild>
                           <Button variant="outline"><Upload className="mr-2 h-4 w-4" />import from quizlet</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>import set from quizlet via copy paste</DialogTitle>
                            <DialogDescription>
                              <b> to copy and paste your set from Quizlet (in Quizlet, go to your set &gt; 3 dots &gt; export (make sure tab and new line are selected) &gt; copy text)</b>. input will automatically be formatted as term tab definition. paste your tab-separated list in box below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                             <Textarea
                                placeholder="arbeiten	to work..."
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                                className="h-48"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                              />
                          </div>
                          <DialogFooter>
                            <Button onClick={handleImport}>import cards</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <form>
                  <div className="mb-8">
                    <Label htmlFor="title" className="text-lg font-semibold">Set Title</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      className={`mt-2 text-xl p-4 ${
                        theme === 'confesh' 
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                          : 'bg-background border-border'
                      }`}
                      placeholder="e.g. German Vocabulary"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    {errors.title && <p className="text-destructive mt-1">{errors.title.message}</p>}
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      <TabsTrigger value="upload">Upload File</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manual" className="mt-6">
                      <div className="space-y-6">
                        {fields.map((field, index) => (
                          <div key={field.id} className={`flex gap-4 items-start p-4 border rounded-lg ${
                            theme === 'confesh' 
                              ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                              : 'bg-background border-border'
                          }`}>
                             <div className="font-bold text-lg text-muted-foreground pt-2">{index + 1}</div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`cards.${index}.front`}>Front</Label>
                                <Textarea
                                  id={`cards.${index}.front`}
                                  {...register(`cards.${index}.front`)}
                                  placeholder="e.g. wie geht's?"
                                  className={`mt-1 resize-none ${
                                    theme === 'confesh' 
                                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                                      : 'bg-background border-border'
                                  }`}
                                  autoComplete="off"
                                  autoCorrect="off"
                                  autoCapitalize="off"
                                  spellCheck="false"
                                />
                                {errors.cards?.[index]?.front && <p className="text-destructive mt-1">{errors.cards[index]?.front?.message}</p>}
                              </div>
                              <div>
                                <Label htmlFor={`cards.${index}.back`}>Back</Label>
                                <Textarea
                                  id={`cards.${index}.back`}
                                  {...register(`cards.${index}.back`)}
                                  placeholder="e.g. how are you?"
                                  className={`mt-1 resize-none ${
                                    theme === 'confesh' 
                                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                                      : 'bg-background border-border'
                                  }`}
                                  onKeyDown={(e) => handleKeyDown(e, index)}
                                  autoComplete="off"
                                  autoCorrect="off"
                                  autoCapitalize="off"
                                  spellCheck="false"
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

                      <div className="flex justify-between items-center mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => append({ front: '', back: '' })}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          add card
                        </Button>

                        <Button type="submit" size="lg" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          create set
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-6">
                      <div className="space-y-6">
                        {/* PDF Upload Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Upload PDF
                          </h3>
                          
                          <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                              isDragOver 
                                ? 'border-primary bg-primary/5' 
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium mb-2">Drop your PDF here</p>
                            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleFileInput}
                              className="hidden"
                              id="pdf-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('pdf-upload')?.click()}
                            >
                              Choose File
                            </Button>
                          </div>
                          
                          {uploadedFile && (
                            <div className="p-4 border rounded-lg bg-muted/50">
                              <p className="font-medium">Uploaded: {uploadedFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                File size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Google Drive Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <LinkIcon className="h-5 w-5" />
                            Google Drive Link
                          </h3>
                          
                          <div className="space-y-3">
                            <Input
                              type="url"
                              placeholder="https://drive.google.com/file/d/..."
                              value={googleDriveLink}
                              onChange={(e) => setGoogleDriveLink(e.target.value)}
                              className={`${
                                theme === 'confesh' 
                                  ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                                  : 'bg-background border-border'
                              }`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleGoogleDriveLink}
                              disabled={!googleDriveLink.trim()}
                            >
                              Add Google Drive File
                            </Button>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          {/* <p className="text-sm text-muted-foreground">
                            File processing will be implemented soon. For now, you can upload files and they will be stored for future processing.
                          </p> */}
                          <p className="text-sm text-muted-foreground">
                            this feature took a bit of a backseat for now, will be implemented later.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
