import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Unlock,
  Plus,
  Upload,
  Save,
  Settings,
  Palette,
  DollarSign,
  Edit,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import type { Design, SizeOption } from "@shared/schema";

const authSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const designSchema = z.object({
  title: z.string().min(1, "Design title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z
    .any()
    .refine((files) => files?.length > 0, "Design image is required"),
});

const editDesignSchema = z.object({
  title: z.string().min(1, "Design title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.any().optional(),
});

const sizeOptionUpdateSchema = z.object({
  stripeProductId: z.string().min(1, "Stripe Product ID is required"),
  stripePriceId: z.string().min(1, "Stripe Price ID is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  description: z.string().optional(),
});

type AuthForm = z.infer<typeof authSchema>;
type DesignForm = z.infer<typeof designSchema>;
type SizeOptionUpdateForm = z.infer<typeof sizeOptionUpdateSchema>;

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authForm = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { password: "" },
  });

  const [editingDesign, setEditingDesign] = useState<Design | null>(null);

  const designForm = useForm<DesignForm>({
    resolver: zodResolver(designSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const editDesignForm = useForm<z.infer<typeof editDesignSchema>>({
    resolver: zodResolver(editDesignSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Fetch designs and size options
  const { data: designs } = useQuery<Design[]>({
    queryKey: ["/api/designs"],
    enabled: isAuthenticated,
  });

  const { data: sizeOptions } = useQuery<SizeOption[]>({
    queryKey: ["/api/size-options"],
    enabled: isAuthenticated,
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

  const designUploadMutation = useMutation({
    mutationFn: async (data: DesignForm) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("image", data.image[0]);

      const response = await fetch("/api/admin/designs", {
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
        title: "Design Uploaded",
        description: "New design has been added successfully",
      });
      designForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/designs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editDesignMutation = useMutation({
    mutationFn: async (data: { id: number; formData: FormData }) => {
      const response = await fetch(`/api/admin/designs/${data.id}`, {
        method: "PUT",
        body: data.formData,
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
        title: "Design Updated",
        description: "Design has been successfully updated",
      });
      setEditingDesign(null);
      editDesignForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/designs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDesignMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/designs/${id}`, {
        method: "DELETE",
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
        title: "Design Deleted",
        description: "Design has been removed from the gallery",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/designs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sizeOptionUpdateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: SizeOptionUpdateForm;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/size-options/${id}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Size Option Updated",
        description: "Stripe integration has been configured",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/size-options"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onAuth = (data: AuthForm) => {
    authMutation.mutate(data);
  };

  const onDesignUpload = (data: DesignForm) => {
    designUploadMutation.mutate(data);
  };

  const onEditDesign = (data: z.infer<typeof editDesignSchema>) => {
    if (!editingDesign) return;

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    if (data.image && data.image.length > 0) {
      formData.append("image", data.image[0]);
    }

    editDesignMutation.mutate({ id: editingDesign.id, formData });
  };

  const startEditing = (design: Design) => {
    setEditingDesign(design);
    editDesignForm.setValue("title", design.title);
    editDesignForm.setValue("description", design.description);
  };

  const cancelEditing = () => {
    setEditingDesign(null);
    editDesignForm.reset();
  };

  return (
    <main className="pt-20 py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        {!isAuthenticated ? (
          // Admin Login Form
          <Card className="glass-morphism max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-4xl font-display font-bold text-center">
                <Shield className="text-electric mr-4 inline" />
                <span className="text-white">ADMIN</span>{" "}
                <span className="text-matrix">ACCESS</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...authForm}>
                <form
                  onSubmit={authForm.handleSubmit(onAuth)}
                  className="space-y-6"
                >
                  <FormField
                    control={authForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-matrix font-mono text-sm">
                          ACCESS CODE
                        </FormLabel>
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
                    {authMutation.isPending
                      ? "AUTHENTICATING..."
                      : "AUTHENTICATE"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          // Admin Dashboard
          <div className="space-y-8">
            <h1 className="text-5xl font-display font-bold text-center">
              <span className="text-matrix">BTC GLASS</span>{" "}
              <span className="text-electric">ADMIN</span>
            </h1>

            <Tabs defaultValue="designs" className="w-full">
              <TabsList className="grid w-full grid-cols-3 glass-morphism">
                <TabsTrigger value="designs" className="font-mono">
                  <Palette className="mr-2" size={16} />
                  DESIGNS
                </TabsTrigger>
                <TabsTrigger value="sizes" className="font-mono">
                  <Settings className="mr-2" size={16} />
                  SIZE OPTIONS
                </TabsTrigger>
                <TabsTrigger value="stripe" className="font-mono">
                  <DollarSign className="mr-2" size={16} />
                  STRIPE CONFIG
                </TabsTrigger>
              </TabsList>

              {/* Designs Tab */}
              <TabsContent value="designs" className="space-y-6">
                <Card className="glass-morphism">
                  <CardHeader>
                    <CardTitle className="text-3xl font-display font-bold text-electric">
                      <Plus className="mr-4 inline" />
                      ADD NEW DESIGN
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...designForm}>
                      <form
                        onSubmit={designForm.handleSubmit(onDesignUpload)}
                        className="space-y-6"
                      >
                        <FormField
                          control={designForm.control}
                          name="image"
                          render={({
                            field: { onChange, value, ...field },
                          }) => (
                            <FormItem>
                              <FormLabel className="text-matrix font-mono text-sm">
                                DESIGN IMAGE *
                              </FormLabel>
                              <FormControl>
                                <div className="border-2 border-dashed border-matrix/30 rounded-lg p-8 text-center hover:border-matrix transition-all">
                                  <Upload className="text-4xl text-gray-400 mb-4 mx-auto" />
                                  <p className="text-gray-400 font-mono mb-2">
                                    Drag & drop image here or click to browse
                                  </p>
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
                                    onClick={() =>
                                      document
                                        .querySelector('input[type="file"]')
                                        ?.click()
                                    }
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
                            control={designForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-matrix font-mono text-sm">
                                  DESIGN TITLE *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green"
                                    placeholder="Genesis Block"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={designForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-matrix font-mono text-sm">
                                DESCRIPTION *
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green h-32"
                                  placeholder="The first Bitcoin block ever mined, etched in elegant glass..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full py-4 bg-gradient-to-r from-matrix to-electric text-black font-bold font-mono rounded-lg hover:shadow-cyber transition-all transform hover:scale-105"
                          disabled={designUploadMutation.isPending}
                        >
                          <Save className="mr-2" size={20} />
                          {designUploadMutation.isPending
                            ? "UPLOADING..."
                            : "UPLOAD DESIGN"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Existing Designs */}
                {designs && designs.length > 0 && (
                  <Card className="glass-morphism">
                    <CardHeader>
                      <CardTitle className="text-2xl font-display font-bold text-white">
                        EXISTING DESIGNS ({designs.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {designs.map((design) => (
                          <div
                            key={design.id}
                            className="bg-darker-surface rounded-lg p-4 border border-matrix/30"
                          >
                            <img
                              src={design.imageUrl}
                              alt={design.title}
                              className="w-full h-32 object-cover rounded-lg mb-4"
                            />
                            <h3 className="text-white font-mono font-bold mb-2">
                              {design.title}
                            </h3>
                            <p className="text-gray-300 text-xs mb-4">
                              {design.description}
                            </p>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => startEditing(design)}
                                className="flex-1 cyber-border text-matrix border-matrix hover:bg-matrix hover:text-black font-mono text-xs"
                              >
                                <Edit className="mr-1" size={12} />
                                EDIT
                              </Button>
                              <Button
                                onClick={() =>
                                  deleteDesignMutation.mutate(design.id)
                                }
                                className="flex-1 cyber-border text-red-400 border-red-400 hover:bg-red-400 hover:text-black font-mono text-xs"
                              >
                                <Trash2 className="mr-1" size={12} />
                                DELETE
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Design Editing Dialog */}
              {editingDesign && (
                <Dialog
                  open={!!editingDesign}
                  onOpenChange={() => cancelEditing()}
                >
                  <DialogContent className="glass-morphism max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-display font-bold text-electric">
                        <Edit className="mr-2 inline" />
                        EDIT DESIGN
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...editDesignForm}>
                      <form
                        onSubmit={editDesignForm.handleSubmit(onEditDesign)}
                        className="space-y-6"
                      >
                        <FormField
                          control={editDesignForm.control}
                          name="image"
                          render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                              <FormLabel className="text-matrix font-mono text-sm">
                                NEW IMAGE (Optional)
                              </FormLabel>
                              <FormControl>
                                <div className="space-y-4">
                                  <Input
                                    {...rest}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => onChange(e.target.files)}
                                  />
                                  <Button
                                    type="button"
                                    className="cyber-border text-matrix border-matrix hover:bg-matrix hover:text-black font-mono"
                                    onClick={() =>
                                      document
                                        .querySelector('input[type="file"]')
                                        ?.click()
                                    }
                                  >
                                    BROWSE FILES
                                  </Button>
                                  <div className="text-xs text-gray-400 font-mono">
                                    Leave empty to keep current image
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={editDesignForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-matrix font-mono text-sm">
                                  DESIGN TITLE *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green"
                                    placeholder="Genesis Block"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={editDesignForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-matrix font-mono text-sm">
                                DESCRIPTION *
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  className="bg-darker-surface border-matrix/30 text-white font-mono focus:border-matrix focus:shadow-neon-green"
                                  placeholder="A stunning glass representation of the first Bitcoin block..."
                                  rows={4}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex space-x-4">
                          <Button
                            type="submit"
                            disabled={editDesignMutation.isPending}
                            className="flex-1 cyber-border text-matrix border-matrix hover:bg-matrix hover:text-black font-mono"
                          >
                            {editDesignMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            UPDATE DESIGN
                          </Button>
                          <Button
                            type="button"
                            onClick={cancelEditing}
                            className="flex-1 cyber-border text-gray-400 border-gray-400 hover:bg-gray-400 hover:text-black font-mono"
                          >
                            CANCEL
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}

              {/* Size Options Tab */}
              <TabsContent value="sizes" className="space-y-6">
                <Card className="glass-morphism">
                  <CardHeader>
                    <CardTitle className="text-3xl font-display font-bold text-electric">
                      <Settings className="mr-4 inline" />
                      SIZE OPTIONS & PRICING
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sizeOptions && sizeOptions.length > 0 ? (
                      <div className="space-y-6">
                        {sizeOptions.map((sizeOption) => (
                          <SizeOptionCard
                            key={sizeOption.id}
                            sizeOption={sizeOption}
                            onUpdate={(data) =>
                              sizeOptionUpdateMutation.mutate({
                                id: sizeOption.id,
                                data,
                              })
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 font-mono text-center py-8">
                        No size options found. Run the migration script first.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stripe Config Tab */}
              <TabsContent value="stripe" className="space-y-6">
                <Card className="glass-morphism">
                  <CardHeader>
                    <CardTitle className="text-3xl font-display font-bold text-electric">
                      <DollarSign className="mr-4 inline" />
                      STRIPE INTEGRATION GUIDE
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-darker-surface rounded-lg p-6 border border-matrix/30">
                      <h3 className="text-matrix font-mono font-bold mb-4">
                        📋 SETUP INSTRUCTIONS
                      </h3>
                      <ol className="space-y-2 text-gray-300 font-mono text-sm">
                        <li>1. Go to your Stripe Dashboard → Products</li>
                        <li>2. Create 3 products with these exact names:</li>
                        <li className="ml-4">• "6 Inch Glass Art" - $149.99</li>
                        <li className="ml-4">
                          • "12 Inch Glass Art" - $299.99
                        </li>
                        <li className="ml-4">
                          • "15 Inch Glass Art" - $449.99
                        </li>
                        <li>3. Copy the Product ID and Price ID for each</li>
                        <li>4. Paste them into the Size Options tab above</li>
                      </ol>
                    </div>

                    <div className="bg-darker-surface rounded-lg p-6 border border-cyber-pink/30">
                      <h3 className="text-cyber-pink font-mono font-bold mb-4">
                        ⚠️ IMPORTANT NOTES
                      </h3>
                      <ul className="space-y-2 text-gray-300 font-mono text-sm">
                        <li>• Product IDs start with "prod_"</li>
                        <li>• Price IDs start with "price_"</li>
                        <li>• Make sure to use the LIVE keys for production</li>
                        <li>• Test with small amounts first</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  );
}

// Component for editing individual size options
// Replace the SizeOptionCard component in admin.tsx (around line 1350)

function SizeOptionCard({
  sizeOption,
  onUpdate,
}: {
  sizeOption: SizeOption;
  onUpdate: (data: SizeOptionUpdateForm) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<SizeOptionUpdateForm>({
    resolver: zodResolver(sizeOptionUpdateSchema),
    defaultValues: {
      stripeProductId: sizeOption.stripeProductId || "",
      stripePriceId: sizeOption.stripePriceId || "",
      price: sizeOption.price ? parseFloat(sizeOption.price.toString()) : 0, // Fix NaN issue
      description: sizeOption.description || "",
    },
  });

  const onSubmit = (data: SizeOptionUpdateForm) => {
    onUpdate(data);
    setIsEditing(false);
  };

  const isConfigured = sizeOption.stripeProductId && sizeOption.stripePriceId;

  return (
    <div
      className={`bg-darker-surface rounded-lg p-6 border-2 ${
        isConfigured ? "border-matrix/30" : "border-cyber-pink/30"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-mono font-bold text-lg">
            {sizeOption.name}
          </h3>
          <p className="text-gray-400 text-sm">{sizeOption.size}" Glass Art</p>
        </div>
        <div className="text-right">
          <p className="text-matrix font-mono font-bold text-xl">
            ${parseFloat(sizeOption.price?.toString() || "0").toFixed(2)}
          </p>
          <p
            className={`text-xs font-mono ${isConfigured ? "text-matrix" : "text-cyber-pink"}`}
          >
            {isConfigured ? "✅ CONFIGURED" : "⚠️ NEEDS SETUP"}
          </p>
        </div>
      </div>

      {isEditing ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stripeProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-matrix font-mono text-xs">
                      STRIPE PRODUCT ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-background border-matrix/30 text-white font-mono text-sm focus:border-matrix"
                        placeholder="prod_..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripePriceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-matrix font-mono text-xs">
                      STRIPE PRICE ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-background border-matrix/30 text-white font-mono text-sm focus:border-matrix"
                        placeholder="price_..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-matrix font-mono text-xs">
                    PRICE (USD)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value || ""} // Ensure controlled input
                      className="bg-background border-matrix/30 text-white font-mono text-sm focus:border-matrix"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseFloat(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-matrix text-black font-mono text-sm"
              >
                SAVE
              </Button>
              <Button
                type="button"
                variant="outline"
                className="font-mono text-sm"
                onClick={() => setIsEditing(false)}
              >
                CANCEL
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-300 text-sm">{sizeOption.description}</p>
          {isConfigured && (
            <div className="text-xs font-mono text-gray-500">
              <p>Product: {sizeOption.stripeProductId}</p>
              <p>Price: {sizeOption.stripePriceId}</p>
            </div>
          )}
          <Button
            onClick={() => setIsEditing(true)}
            className="mt-4 cyber-border font-mono text-sm"
          >
            <Edit className="mr-2" size={14} />
            {isConfigured ? "EDIT CONFIG" : "SETUP STRIPE"}
          </Button>
        </div>
      )}
    </div>
  );
}
