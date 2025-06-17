import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import type { Faq } from "@shared/schema";

export function FaqsPage() {
  const { data: faqs, isLoading, error } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about our custom glass art
            </p>
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-lg text-red-600 dark:text-red-400">
                Failed to load FAQs. Please try again later.
              </p>
            </div>
          )}

          {faqs && faqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No FAQs available at the moment.
              </p>
            </div>
          )}

          {faqs && faqs.length > 0 && (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={`item-${faq.id}`}
                  className="border border-border rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left py-6 hover:no-underline">
                    <span className="font-medium text-lg">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-2">
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {faq.answer}
                    </div>
                    {faq.category && (
                      <div className="mt-4">
                        <span className="inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                          {faq.category}
                        </span>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          <div className="mt-16 text-center">
            <div className="bg-muted/50 rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">Still have questions?</h2>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Get in touch with our team.
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Email:</strong> support@btcglass.com
                </p>
                <p className="text-sm">
                  <strong>Response time:</strong> Usually within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}