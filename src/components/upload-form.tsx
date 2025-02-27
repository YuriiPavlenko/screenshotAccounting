"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Database } from "@/lib/database.types"

// Form schema for transaction details
const transactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  card_id: z.string().min(1, "Card is required"),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [extractedData, setExtractedData] = useState<TransactionFormValues | null>(null)
  const [cards, setCards] = useState<any[]>([])

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      category: "",
      card_id: "",
    },
  })

  // Fetch cards when component mounts
  useState(() => {
    const fetchCards = async () => {
      const { data } = await supabase.from("cards").select("*")
      if (data) {
        setCards(data)
      }
    }

    fetchCards()
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setIsUploading(true)

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage.from("receipts").upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("receipts").getPublicUrl(fileName)

      // Process the image with OCR
      await processImage(publicUrl)
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your receipt.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const processImage = async (imageUrl: string) => {
    try {
      setIsProcessing(true)

      // Call your OCR API endpoint
      const response = await fetch("/api/extract-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) throw new Error("OCR processing failed")

      const data = await response.json()

      // Update form with extracted data
      if (data) {
        setExtractedData(data)
        form.reset({
          date: data.date || new Date().toISOString().split("T")[0],
          description: data.description || "",
          amount: data.amount ? String(data.amount) : "",
          category: data.category || "",
          card_id: data.card_id || (cards.length > 0 ? cards[0].id : ""),
        })
      }

      toast({
        title: "Receipt processed",
        description: "Transaction details have been extracted. Please review and edit if needed.",
      })
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "There was an error extracting details from your receipt.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      setIsSubmitting(true)

      // Convert amount to number
      const amount = Number.parseFloat(values.amount)

      // Insert transaction into database
      const { error } = await supabase.from("transactions").insert({
        date: values.date,
        description: values.description,
        amount: amount,
        category: values.category,
        card_id: values.card_id,
      })

      if (error) throw error

      // Update card balance
      const { error: cardError } = await supabase.rpc("update_card_balance", {
        p_card_id: values.card_id,
        p_amount: amount,
      })

      if (cardError) throw cardError

      toast({
        title: "Transaction saved",
        description: "Your transaction has been successfully saved.",
      })

      // Reset form and state
      setFile(null)
      setPreview(null)
      setExtractedData(null)
      form.reset()

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {!extractedData ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="receipt">Upload Receipt</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading || isProcessing}
                />
                <p className="text-sm text-muted-foreground">Upload a screenshot of your transaction receipt</p>
              </div>

              {preview && (
                <div className="mt-4">
                  <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border">
                    <Image src={preview || "/placeholder.svg"} alt="Receipt preview" fill className="object-contain" />
                  </div>
                </div>
              )}

              <Button onClick={handleUpload} disabled={!file || isUploading || isProcessing} className="mt-4">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process Receipt
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>Use negative values for expenses</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="food">Food & Dining</SelectItem>
                            <SelectItem value="shopping">Shopping</SelectItem>
                            <SelectItem value="transportation">Transportation</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="utilities">Bills & Utilities</SelectItem>
                            <SelectItem value="health">Health & Medical</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="card_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a card" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cards.map((card) => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.name} (*{card.last_four})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Transaction"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFile(null)
                      setPreview(null)
                      setExtractedData(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

