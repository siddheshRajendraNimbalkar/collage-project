'use client'
import { useState } from "react";
import * as z from "zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { SingleImageDropzoneUsage } from "@/components/Custom/Dashbords/ProductImage";

// Dialog components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null); // Custom message state
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null); // For success/error distinction
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Dialog visibility state
  
  const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.number().min(0, "Price must be a positive number"),
    stock: z.number().min(0, "Stock must be a positive number"),
    product_url: z.string().url("Invalid URL"),
    category: z.string().optional(),
    type: z.string().optional(),
  });

  type ProductFormValues = z.infer<typeof productSchema>;

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
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      setMessage(null); 

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication Error: No authentication token found.");
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/api/createProduct`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if(response.data.message){
        setMessage(response.data.message);
        setMessageType("error");
      }else{
        setMessage("Product created successfully!");
        setMessageType("success");
      }

      
    } catch (error: any) {
      console.error("Error creating product:", error);

      if (axios.isAxiosError(error)) {
        const errorMessage = error?.response?.data?.message || "Failed to create product.";
        setMessage(errorMessage);
        setMessageType("error");
      } else {
        setMessage(error.message || "An unexpected error occurred.");
        setMessageType("error");
      }
    } finally {
      setLoading(false);
      setIsDialogOpen(true); // Open the dialog box after operation
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold text-gray-800">
            Add New Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Image Upload */}
              <FormField
                control={form.control}
                name="product_url"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center relative">
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <div className="relative w-fit">
                        <SingleImageDropzoneUsage
                          values={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
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

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description"
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price and Stock */}
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
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
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
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Product"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dialog Box */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{messageType === "success" ? "Success" : "Error"}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)} className={`${messageType == 'success' ? "bg-green-800" : "bg-red-800"} text-white hover:bg-black hover:text-white`}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;  