import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateRideRequest, getListRideRequestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  passengerName: z.string().min(2, "Name must be at least 2 characters"),
  passengerPhone: z.string().min(8, "Valid phone number required"),
  fromLocation: z.string().min(2, "Starting location required"),
  toLocation: z.string().min(2, "Destination required"),
  travelDate: z.string().min(1, "Date is required"),
  passengerCount: z.coerce.number().min(1, "At least 1 passenger").max(10, "Maximum 10 passengers"),
  offeredPrice: z.coerce.number().min(5, "Minimum offer is $5"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewRideRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateRideRequest();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passengerName: "",
      passengerPhone: "",
      fromLocation: "",
      toLocation: "",
      travelDate: new Date().toISOString().split("T")[0],
      passengerCount: 1,
      offeredPrice: 20,
      notes: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Request posted!",
            description: "Drivers can now see and accept your ride request.",
          });
          queryClient.invalidateQueries({ queryKey: getListRideRequestsQueryKey() });
          setLocation("/?tab=requests");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to post request. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to board
        </Link>
        
        <Card className="border-t-4 border-t-secondary shadow-md">
          <CardHeader>
            <CardTitle className="text-3xl font-serif">Request a Ride</CardTitle>
            <CardDescription className="text-base">
              Need to get somewhere? Post a request and offer a price. A driver going your way can pick it up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fromLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Wagga Wagga" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="toLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Albury" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="travelDate"
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
                    name="passengerCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Passengers</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passengerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passengerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="0400 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="offeredPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Offered Price ($)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">$</span>
                          <Input type="number" min="5" className="pl-7" {...field} />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Drivers pay a 10% platform fee from this amount.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g. Have one small suitcase. Flexible on exact time." 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" variant="secondary" className="w-full text-lg h-12" disabled={createMutation.isPending} data-testid="button-submit-request">
                  {createMutation.isPending ? "Posting..." : "Post Request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
