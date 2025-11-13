'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";

const categoryTypes: Record<string, string[]> = {
  art: ["Photograph", "Pattern", "3d", "Picture"],
  poster: ["Cars", "Nature", "Wildlife"],
  design: ["Logo", "UI/UX", "Lllustration", "branding", "Motion"],
  tech: ["Blockchain", "Cybersecurity", "AI", "Cloud", "IOT"],
  photography: ["Nature", "Portrait", "Street", "Travel", "Wildlife"],
  fashion: ["Babys", "Women", "Men", "Kids", "Animals"],
  electronics: ["Mobile", "Laptop", "Skin", "Tv"],
  books: ["Story", "Knowledge", "Manga", "Fiction", "Business"],
};

const Page = () => {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const router = useRouter();
  const availableTypes = selectedCategory ? categoryTypes[selectedCategory] || [] : [];

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication Error: No token found");

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/api/productId`,
          { id: params.productID },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const productData = response.data.product;
        // Update form with existing data
        form.setValue("name", productData.name)

        form.setValue("description", productData.description)
        form.setValue("price", productData.price)
        form.setValue("stock", productData.stock)
        form.setValue("product_url", productData.product_url)
        form.setValue("category", productData.category)
        form.setValue("type", productData.type)
      

        setSelectedCategory(productData.category);

      } catch (error) {
        setMessage("Failed to load product data");
        setMessageType("error");
        setIsDialogOpen(true);
      } finally {
        setInitialLoading(false);
      }
    };

    if (params.productID) {
      fetchProduct();
    }
  }, [params.productId]); // Keep the dependency

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      setMessage(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication Error: No token found");
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/api/updateProduct`,
        {
          id: params.productID,
          name: data.name,
          description: data.description,
          price: data.price,
          product_url: data.product_url,
          category: data.category,
          type: data.type,
          stock: data.stock
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );


      if (response.data.message) {
        setMessage(response.data.message);
        setMessageType("error");
      } else {
        setMessage("Product updated successfully!");
        setMessageType("success");
      }
    } catch (error: any) {

      if (axios.isAxiosError(error)) {
        const errorMessage = error?.response?.data?.message || "Failed to update product.";
        setMessage(errorMessage);
        setMessageType("error");
      } else {
        setMessage(error.message || "An unexpected error occurred.");
        setMessageType("error");
      }
    } finally {
      setLoading(false);
      setIsDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/api/deleteProduct`,
        { id: params.productID },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage("Product deleted successfully!");
      setMessageType("success");
      setDeleteDialogOpen(false);
      setIsDialogOpen(true);
      
      setTimeout(() => {
        router.push("/selling/product");
      }, 2000);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Failed to delete product");
      setMessageType("error");
      setDeleteDialogOpen(false);
      setIsDialogOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <p>Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold text-gray-800">
            Update Product
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

                      <SingleImageDropzoneUsage
                        values={field.value}
                        onChange={field.onChange}
                      />
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
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategory(value);
                      }}
                      value={field.value}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent className="bg-white">
                        {Object.keys(categoryTypes).map((category) => (
                          <SelectItem key={category} value={category} className="cursor-pointer">{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />


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
                        <SelectContent className="bg-white">
                          {availableTypes.map((type: string) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader size="sm" />
                      Updating...
                    </div>
                  ) : (
                    "Update Product"
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Product
                </Button>
              </div>
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
            <Button
              onClick={() => setIsDialogOpen(false)}
              className={`${messageType === 'success' ? "bg-green-800" : "bg-red-800"} text-white hover:bg-black hover:text-white`}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <div className="flex items-center gap-2">
                  <Loader size="sm" />
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;