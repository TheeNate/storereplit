import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Unlock, Plus, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const authSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const productSchema = z.object({
  title: z.string().min(1, "Product title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  image: z.any().refine((files) => files?.length > 0, "Product image is required"),
});

type AuthForm = z.infer<typeof authSchema>;
type ProductForm = z.infer<typeof productSchema>;

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authForm = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { password: "" },
  });

  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
    },
  });

  const authMutation = useMutation({
    mutationFn: async (data: AuthForm) => {
      const response = await apiRequest("POST", "/api/admin/auth", data);
      return response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "Authentication Successful",
        description: "Welcome to the admin panel",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('image', data.image[0]);

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Uploaded",
        description: "New product has been added successfully",
      });
      productForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onAuth = (data: AuthForm) => {
    authMutation.mutate(data);
  };

  const onUpload = (data: ProductForm) => {
    uploadMutation.mutate(data);
  };

  return (
    <main className="pt-20 py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        {!isAuthenticated ? (
          // Admin Login Form
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="text-4xl font-display font-bold text-center">
                <Shield className="text-electric mr-4 inline" />
                <span className="text-white">ADMIN</span> <span className="text-matrix">ACCESS</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...authForm}>
                <form onSubmit={authForm.handleSubmit(onAuth)} className="max-w-md mx-auto space-y-6">
                  <FormField
                    control={authForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-matrix font-mono text-sm">ACCESS CODE</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="password"
                            className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green"
                            placeholder="Enter admin password..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full py-3 bg-matrix text-black font-mono font-bold rounded-lg hover:shadow-cyber transition-all"
                    disabled={authMutation.isPending}
                  >
                    <Unlock className="mr-2" size={20} />
                    {authMutation.isPending ? "AUTHENTICATING..." : "AUTHENTICATE"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          // Product Upload Form
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="text-3xl font-display font-bold text-electric">
                <Plus className="mr-4 inline" />
                ADD NEW PRODUCT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(onUpload)} className="space-y-6">
                  <FormField
                    control={productForm.control}
                    name="image"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-matrix font-mono text-sm">PRODUCT IMAGE *</FormLabel>
                        <FormControl>
                          <div className="border-2 border-dashed border-matrix/30 rounded-lg p-8 text-center hover:border-matrix transition-all">
                            <Upload className="text-4xl text-gray-400 mb-4 mx-auto" />
                            <p className="text-gray-400 font-mono mb-2">Drag & drop image here or click to browse</p>
                            <Input
                              {...field}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => onChange(e.target.files)}
                            />
                            <Button 
                              type="button" 
                              className="cyber-border font-mono hover:shadow-neon-green"
                              onClick={() => document.querySelector('input[type="file"]')?.click()}
                            >
                              BROWSE FILES
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={productForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-matrix font-mono text-sm">PRODUCT TITLE *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green"
                              placeholder="Genesis Block Prism"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-matrix font-mono text-sm">PRICE (USD) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              step="0.01"
                              className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green"
                              placeholder="2100.00"
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={productForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-matrix font-mono text-sm">DESCRIPTION *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green h-32"
                            placeholder="Hand-etched glass featuring the first Bitcoin block hash..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full py-4 bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
                    disabled={uploadMutation.isPending}
                  >
                    <Save className="mr-2" size={20} />
                    {uploadMutation.isPending ? "UPLOADING..." : "UPLOAD PRODUCT"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
