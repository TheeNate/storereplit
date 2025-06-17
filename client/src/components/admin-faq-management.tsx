import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Faq } from "@shared/schema";

const faqSchema = z.object({
  question: z.string().min(1, "Question is required").max(500, "Question too long"),
  answer: z.string().min(1, "Answer is required").max(2000, "Answer too long"),
  category: z.string().optional(),
  isActive: z.boolean(),
  displayOrder: z.number().min(0, "Display order must be 0 or greater"),
});

type FaqFormData = z.infer<typeof faqSchema>;

export function AdminFaqManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: faqs, isLoading } = useQuery<Faq[]>({
    queryKey: ["/api/admin/faqs"],
  });

  const form = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "",
      isActive: true,
      displayOrder: 0,
    },
  });

  const createFaqMutation = useMutation({
    mutationFn: (data: FaqFormData) =>
      apiRequest("/api/admin/faqs", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      setIsDialogOpen(false);
      setEditingFaq(null);
      form.reset();
      toast({
        title: "Success",
        description: "FAQ created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create FAQ",
        variant: "destructive",
      });
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FaqFormData> }) =>
      apiRequest(`/api/admin/faqs/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      setIsDialogOpen(false);
      setEditingFaq(null);
      form.reset();
      toast({
        title: "Success",
        description: "FAQ updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update FAQ",
        variant: "destructive",
      });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/faqs/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({
        title: "Success",
        description: "FAQ deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete FAQ",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FaqFormData) => {
    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, data });
    } else {
      createFaqMutation.mutate(data);
    }
  };

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    form.reset({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "",
      isActive: faq.isActive,
      displayOrder: faq.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      deleteFaqMutation.mutate(id);
    }
  };

  const toggleActiveStatus = (faq: Faq) => {
    updateFaqMutation.mutate({
      id: faq.id,
      data: { isActive: !faq.isActive },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">FAQ Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingFaq(null);
                form.reset({
                  question: "",
                  answer: "",
                  category: "",
                  isActive: true,
                  displayOrder: faqs ? faqs.length : 0,
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFaq ? "Edit FAQ" : "Create New FAQ"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the question..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Answer</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the answer..."
                          rows={6}
                          {...field}
                        />
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
                      <FormLabel>Category (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Shipping, Orders, Products..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Show this FAQ on the public page
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingFaq(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingFaq ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading FAQs...</div>
      ) : (
        <div className="grid gap-4">
          {faqs?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No FAQs created yet.</p>
              </CardContent>
            </Card>
          ) : (
            faqs?.map((faq) => (
              <Card key={faq.id}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                        <Badge variant={faq.isActive ? "default" : "secondary"}>
                          {faq.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {faq.category && (
                          <Badge variant="outline">{faq.category}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Display Order: {faq.displayOrder}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActiveStatus(faq)}
                        disabled={updateFaqMutation.isPending}
                      >
                        {faq.isActive ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(faq)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(faq.id)}
                        disabled={deleteFaqMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm whitespace-pre-wrap">{faq.answer}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}