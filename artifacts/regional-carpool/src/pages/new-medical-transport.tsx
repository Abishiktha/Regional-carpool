import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { useCreateMedicalTransportRequest, getListMedicalTransportRequestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowLeft, Info, AlertCircle } from "lucide-react";
import type { MedicalTransportRequest } from "@workspace/api-client-react";

const formSchema = z.object({
  patientId: z.coerce.number().int().min(1, "Patient ID is required"),
  pickupAddress: z.string().min(3, "Pickup address required"),
  pickupSuburb: z.string().min(2, "Pickup suburb required"),
  destinationName: z.string().min(2, "Destination name required"),
  destinationAddress: z.string().min(3, "Destination address required"),
  tripDate: z.string().min(1, "Trip date required"),
  tripTime: z.string().min(1, "Trip time required"),
  returnTrip: z.boolean(),
  returnTime: z.string().optional(),
  notes: z.string().optional(),
}).refine((d) => !d.returnTrip || (d.returnTime && d.returnTime.length > 0), {
  message: "Return time is required if return trip is selected",
  path: ["returnTime"],
});

type FormValues = z.infer<typeof formSchema>;

export default function NewMedicalTransport() {
  const [submitted, setSubmitted] = useState<MedicalTransportRequest | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const create = useCreateMedicalTransportRequest();

  // Read pre-fill params from recurring appointments page
  const urlParams = new URLSearchParams(window.location.search);
  const prefill = {
    patientId: parseInt(urlParams.get("patientId") ?? "0", 10) || 0,
    destinationName: urlParams.get("destinationName") ?? "",
    destinationAddress: urlParams.get("destinationAddress") ?? "",
    tripDate: urlParams.get("tripDate") ?? "",
    tripTime: urlParams.get("tripTime") ?? "",
  };
  const appointmentId = urlParams.get("appointmentId") ? Number(urlParams.get("appointmentId")) : undefined;
  const fromAppointment = !!appointmentId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: prefill.patientId,
      pickupAddress: "",
      pickupSuburb: "",
      destinationName: prefill.destinationName,
      destinationAddress: prefill.destinationAddress,
      tripDate: prefill.tripDate,
      tripTime: prefill.tripTime,
      returnTrip: false,
      returnTime: "",
      notes: "",
    },
  });

  const returnTrip = form.watch("returnTrip");

  function onSubmit(values: FormValues) {
    setServerError(null);
    const payload = {
      ...values,
      returnTime: values.returnTrip ? values.returnTime : undefined,
      ...(appointmentId ? { appointmentId } : {}),
    };
    create.mutate({ data: payload }, {
      onSuccess: (req) => {
        queryClient.invalidateQueries({ queryKey: getListMedicalTransportRequestsQueryKey() });
        setSubmitted(req);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        if (msg?.includes("verified")) {
          setServerError("Your patient registration is still pending verification. Our team will contact you within 1–2 business days once your details have been confirmed.");
        } else if (msg?.includes("not found")) {
          setServerError("Patient ID not found. Please check the ID from your registration confirmation letter.");
        } else {
          toast({ title: "Booking failed", description: "Please check your details and try again.", variant: "destructive" });
        }
      },
    });
  }

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-teal-700" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Transport Booked</h1>
          <p className="text-muted-foreground mb-6">Your transport request has been submitted and is now pending driver assignment.</p>
          <div className="rounded-xl border bg-card p-5 text-left mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Request ID</span>
              <span className="font-mono font-bold text-lg text-primary" data-testid="text-transport-id">#{submitted.id}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Trip</span>
              <span className="text-sm text-foreground">{submitted.pickupSuburb} → {submitted.destinationName}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Date & Time</span>
              <span className="text-sm text-foreground">{submitted.tripDate} at {submitted.tripTime}</span>
            </div>
            {submitted.returnTrip && submitted.returnTime && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Return</span>
                <span className="text-sm text-foreground">{submitted.returnTime}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5" data-testid="badge-transport-status">Pending assignment</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/medical">
              <Button variant="outline" data-testid="btn-back-medical">Back to Medical Transport</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Link href="/medical" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Medical Transport
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Book Medical Transport</h1>
        <p className="text-muted-foreground mb-4">Request a verified driver for your medical appointment.</p>

        {fromAppointment && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 mb-4 flex gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Pre-filled from recurring appointment.</strong> The clinic name, address, date, and time have been filled in for you. Just add your pickup address and you're done.
            </div>
          </div>
        )}
        <div className="rounded-lg bg-teal-50 border border-teal-200 p-4 text-sm text-teal-800 mb-8 flex gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Verified patients only.</strong> You must be registered and approved before booking. Your Patient ID is on your registration confirmation.
          </div>
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 mb-6 flex gap-2" data-testid="error-server">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>{serverError}</div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField control={form.control} name="patientId" render={({ field }) => (
              <FormItem>
                <FormLabel>Patient ID</FormLabel>
                <FormControl><Input type="number" min={1} placeholder="e.g. 7" data-testid="input-patient-id" {...field} /></FormControl>
                <FormDescription>From your registration confirmation email or screen.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Pickup Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="pickupAddress" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Pickup Street Address</FormLabel>
                    <FormControl><Input placeholder="14 Wattle St" data-testid="input-pickup-address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pickupSuburb" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Suburb</FormLabel>
                    <FormControl><Input placeholder="Dubbo" data-testid="input-pickup-suburb" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Destination</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="destinationName" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Clinic / Hospital Name</FormLabel>
                    <FormControl><Input placeholder="Dubbo Base Hospital" data-testid="input-dest-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="destinationAddress" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Destination Address</FormLabel>
                    <FormControl><Input placeholder="Myamba Parade, Dubbo NSW 2830" data-testid="input-dest-address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Trip Timing</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="tripDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Date</FormLabel>
                    <FormControl><Input type="date" data-testid="input-trip-date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tripTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Time</FormLabel>
                    <FormControl><Input type="time" data-testid="input-trip-time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="returnTrip" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 sm:col-span-2 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-return-trip" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I need a return trip</FormLabel>
                      <FormDescription>The driver will wait or return to collect you after your appointment.</FormDescription>
                    </div>
                  </FormItem>
                )} />
                {returnTrip && (
                  <FormField control={form.control} name="returnTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Return Time</FormLabel>
                      <FormControl><Input type="time" data-testid="input-return-time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
            </section>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes for driver (optional)</FormLabel>
                <FormControl><Textarea placeholder="Mobility aids, preferred entrance, extra time needed..." rows={3} data-testid="textarea-transport-notes" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white h-11"
              disabled={create.isPending}
              data-testid="btn-submit-transport"
            >
              {create.isPending ? "Booking..." : "Request Transport"}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
