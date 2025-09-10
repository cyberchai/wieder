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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, Loader2, ArrowLeft, Upload, FileText, Link as LinkIcon, X, Tag } from 'lucide-react';
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
  tags: z.array(z.string()).optional(),
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
  
  // Parsing options state
  const [termDefinitionSeparator, setTermDefinitionSeparator] = useState("tab");
  const [customTermDefinitionSeparator, setCustomTermDefinitionSeparator] = useState("");
  const [rowSeparator, setRowSeparator] = useState("newline");
  const [customRowSeparator, setCustomRowSeparator] = useState("");
  
  // Tag state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  
  // Predefined tags
  const predefinedTags = [
    'tech', 'finance', 'language', 'german', 'french', 'mandarin', 'thai', 'science'
  ];

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
      tags: [],
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
      await createFlashcardSet(user.uid, data.title, data.cards, data.tags);
      
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
    // Helper function to convert escape sequences in custom separators
    const convertEscapeSequences = (str: string): string => {
      return str
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\s/g, ' ')
        .replace(/\\\\/g, '\\');
    };

    // Get the actual separator values
    const getTermDefinitionSeparator = () => {
      if (termDefinitionSeparator === "custom") {
        return convertEscapeSequences(customTermDefinitionSeparator);
      }
      switch (termDefinitionSeparator) {
        case "tab": return "\t";
        case "comma": return ",";
        default: return "\t";
      }
    };

    const getRowSeparator = () => {
      if (rowSeparator === "custom") {
        return convertEscapeSequences(customRowSeparator);
      }
      switch (rowSeparator) {
        case "newline": return "\n";
        case "semicolon": return ";";
        default: return "\n";
      }
    };

    const termDefSep = getTermDefinitionSeparator();
    const rowSep = getRowSeparator();

    // Validate custom separators
    if (termDefinitionSeparator === "custom" && !termDefSep.trim()) {
      toast({
        title: 'Import Error',
        description: 'Please specify a custom term-definition separator',
        variant: 'destructive',
      });
      return;
    }

    if (rowSeparator === "custom" && !rowSep.trim()) {
      toast({
        title: 'Import Error',
        description: 'Please specify a custom row separator',
        variant: 'destructive',
      });
      return;
    }

    const lines = importText.split(rowSep).filter(line => line.trim() !== '');
    const newCards: { front: string; back: string }[] = [];
    let error = false;
    let errorDetails = '';

    // Debug logging
    console.log('Parsing with separators:', { termDefSep, rowSep });
    console.log('Split into lines:', lines.length);
    console.log('First few lines:', lines.slice(0, 3));

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(termDefSep);
      
      console.log(`Line ${i + 1}: "${line}" -> ${parts.length} parts:`, parts);
      
      if (parts.length === 2) {
        newCards.push({ front: parts[0].trim(), back: parts[1].trim() });
      } else if (parts.length > 2) {
        // If there are more than 2 parts, the separator appears in the content
        // Take the first part as front, and join the rest as back
        const front = parts[0].trim();
        const back = parts.slice(1).join(termDefSep).trim();
        newCards.push({ front, back });
        console.log(`Handled multiple separators: "${front}" -> "${back}"`);
      } else {
        error = true;
        errorDetails = `Line ${i + 1}: "${line}" - Expected format: term${termDefSep}definition`;
        break;
      }
    }

    if (error) {
      const separatorName = termDefinitionSeparator === "custom" ? "custom separator" : 
                           termDefinitionSeparator === "tab" ? "tab character" : 
                           termDefinitionSeparator === "comma" ? "comma" : "separator";
      toast({
        title: 'Import Error',
        description: errorDetails || `Please make sure each row includes a ${separatorName} separating term and definition`,
        variant: 'destructive',
      });
    } else if (newCards.length > 0) {
      setValue('cards', newCards, { shouldValidate: true });
      toast({ title: 'Success!', description: `${newCards.length} cards imported.` });
      setIsImportDialogOpen(false);
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
                      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
                        setIsImportDialogOpen(open);
                        if (!open) {
                          // Reset parsing options when dialog is closed
                          setTermDefinitionSeparator("tab");
                          setCustomTermDefinitionSeparator("");
                          setRowSeparator("newline");
                          setCustomRowSeparator("");
                          setImportText("");
                        }
                      }}>
                        <DialogTrigger asChild>
                           <Button variant="outline"><Upload className="mr-2 h-4 w-4" />import from quizlet</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>import set from quizlet via copy paste</DialogTitle>
                            <DialogDescription>
                              <b> to copy and paste your set from Quizlet (in Quizlet, go to your set &gt; 3 dots &gt; export &gt; copy text)</b>. configure the parsing options below to match your data format, then paste your text in the box below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            {/* Parsing Options */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="term-def-separator">Between term and definition:</Label>
                                <Select value={termDefinitionSeparator} onValueChange={setTermDefinitionSeparator}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tab">Tab</SelectItem>
                                    <SelectItem value="comma">Comma</SelectItem>
                                    <SelectItem value="custom">Custom (specify)</SelectItem>
                                  </SelectContent>
                                </Select>
                                {termDefinitionSeparator === "custom" && (
                                  <Input
                                    placeholder="e.g., , or \\t or any character"
                                    value={customTermDefinitionSeparator}
                                    onChange={e => setCustomTermDefinitionSeparator(e.target.value)}
                                  />
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="row-separator">Between rows:</Label>
                                <Select value={rowSeparator} onValueChange={setRowSeparator}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="newline">New line</SelectItem>
                                    <SelectItem value="semicolon">Semicolon</SelectItem>
                                    <SelectItem value="custom">Custom (specify)</SelectItem>
                                  </SelectContent>
                                </Select>
                                {rowSeparator === "custom" && (
                                  <Input
                                    placeholder="e.g., ; or \\n or any character"
                                    value={customRowSeparator}
                                    onChange={e => setCustomRowSeparator(e.target.value)}
                                  />
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="import-text">Paste your text here:</Label>
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
                              <p className="text-xs text-muted-foreground">
                                Tip: Use \\n for newline, \\t for tab, \\r for carriage return in custom separators
                              </p>
                            </div>
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
                <form onSubmit={handleSubmit(onSubmit)}>
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
                          className={`${
                            theme === 'confesh' 
                              ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                              : 'bg-background border-border'
                          }`}
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
