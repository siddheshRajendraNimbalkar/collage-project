"use client"

import { useState } from "react"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SingleImageDropzoneUsage } from "@/components/Custom/Dashbords/ProductImage"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  stock: z.number().min(0, "Stock must be a positive number"),
  product_url: z.string().url("Invalid URL"),
  category: z.string().optional(),
  type: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      product_url: "",
      category: undefined,
      type: undefined,
    },
  })

  async function onSubmit(data: ProductFormValues) {
    try {
      setLoading(true)
      setMessage(null)

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication Error: No authentication token found.")
      }

      const response = await axios.post("http://localhost:9090/v1/api/createProduct", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      setMessage("Product created successfully!")
      setMessageType("success")
    } catch (error: any) {
      console.error("Error creating product:", error)

      if (axios.isAxiosError(error)) {
        const errorMessage = error?.response?.data?.message || "Failed to create product."
        setMessage(errorMessage)
      } else {
        setMessage(error.message || "An unexpected error occurred.")
      }
      setMessageType("error")
    } finally {
      setLoading(false)
      setIsDialogOpen(true)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold text-gray-800">Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="product_url"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center relative">
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <div className="relative w-fit">
                        <SingleImageDropzoneUsage values={field.value} onChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
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
                      <Textarea placeholder="Enter product description" className="min-h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter price"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter stock quantity"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paintings">Paintings</SelectItem>
                          <SelectItem value="sculptures">Sculptures</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="digital">Digital Art</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="original">Original</SelectItem>
                          <SelectItem value="print">Print</SelectItem>
                          <SelectItem value="limited">Limited Edition</SelectItem>
                          <SelectItem value="commission">Commission</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Product"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle >{messageType === "success" ? "Success" : "Error"}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)} className="bg-red-800 text-white hover:bg-black">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

