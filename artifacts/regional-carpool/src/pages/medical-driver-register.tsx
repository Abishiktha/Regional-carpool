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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useRegisterMedicalDriver } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListMedicalDriversQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react";
import type { MedicalDriver } from "@workspace/api-client-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  phone: z.string().min(8, "Phone required"),
  licenseNumber: z.string().min(4, "License number required"),
  vehicleType: z.string().min(1, "Please select a vehicle type"),
  vehicleRego: z.string().min(2, "Vehicle registration required"),
  vehicleCapacity: z.coerce.number().int().min(1, "Vehicle capacity must be at least 1"),
  hasWheelchairAccess: z.boolean(),
  workingWithChildrenCheck: z.boolean(),
  policeCheckDone: z.boolean().refine((v) => v === true, {
    message: "A police check is required to register as a medical transport driver",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const VEHICLE_TYPES = [
  { value: "Sedan", label: "Sedan" },
  { value: "SUV/4WD", label: "SUV / 4WD" },
  { value: "Van", label: "Van" },
  { value: "Wheelchair-accessible vehicle", label: "Wheelchair-accessible vehicle" },
];

export default function MedicalDriverRegister() {
  const [submitted, setSubmitted] = useState<MedicalDriver | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const register = useRegisterMedicalDriver();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "", phone: "", licenseNumber: "", vehicleType: "",
      vehicleRego: "", vehicleCapacity: 1,
      hasWheelchairAccess: false, workingWithChildrenCheck: false, policeCheckDone: false,
      notes: "",
    },
  });

  function onSubmit(values: FormValues) {
    register.mutate({ data: values }, {
      onSuccess: (driver) => {
        queryClient.invalidateQueries({ queryKey: getListMedicalDriversQueryKey() });
        setSubmitted(driver);
      },
      onError: () => {
        toast({ title: "Registration failed", description: "Please check your details and try again.", variant: "destructive" });
      },
    });
  }

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Registration Received</h1>
          <p className="text-muted-foreground mb-6">Your application is being reviewed by our team.</p>
          <div className="rounded-xl border bg-card p-5 text-left mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Driver ID</span>
              <span className="font-mono font-bold text-lg text-primary" data-testid="text-driver-id">#{submitted.id}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Name</span>
              <span className="text-sm text-foreground">{submitted.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Status</span>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-200" data-testid="badge-driver-status">Pending Verification</Badge>
            </div>
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm text-foreground text-left mb-6">
            <p className="font-semibold mb-1">Verification process</p>
            <p>We verify your police check reference number, driver's license, and vehicle registration. This takes <strong>2–3 business days</strong>. Once approved, you'll appear as an available driver for transport requests in your area.</p>
          </div>
          <Link href="/medical">
            <Button variant="outline" data-testid="btn-back-medical">Back to Medical Transport</Button>
          </Link>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Driver Registration</h1>
        <p className="text-muted-foreground mb-2">Register to transport elderly and mobility-impaired residents to medical appointments.</p>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 mb-8 flex gap-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Background checks required.</strong> All medical transport drivers must hold a current police check. Wheelchair-accessible vehicle drivers may also require additional certification.
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Personal Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Bruce Tanner" data-testid="input-driver-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="0412 345 678" data-testid="input-driver-phone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="licenseNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver's License Number</FormLabel>
                    <FormControl><Input placeholder="12345678" data-testid="input-license" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Vehicle Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="vehicleType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-vehicle-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VEHICLE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehicleRego" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Plate</FormLabel>
                    <FormControl><Input placeholder="ABC 123" data-testid="input-rego" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehicleCapacity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passenger Capacity</FormLabel>
                    <FormControl><Input type="number" min={1} max={12} data-testid="input-capacity" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="hasWheelchairAccess" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-wheelchair" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Wheelchair accessible vehicle</FormLabel>
                    </div>
                  </FormItem>
                )} />
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Checks & Clearances</h2>
              <div className="space-y-4">
                <FormField control={form.control} name="policeCheckDone" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-police-check" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I hold a current National Police Check</FormLabel>
                      <FormDescription>Required for all medical transport drivers. Must be less than 3 years old.</FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="workingWithChildrenCheck" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-wwc" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I hold a Working with Vulnerable People check</FormLabel>
                      <FormDescription>Recommended for drivers transporting elderly passengers.</FormDescription>
                    </div>
                  </FormItem>
                )} />
              </div>
              {form.formState.errors.policeCheckDone && (
                <p className="text-sm text-destructive mt-2">{form.formState.errors.policeCheckDone.message}</p>
              )}
            </section>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (optional)</FormLabel>
                <FormControl><Textarea placeholder="Availability, areas you cover, or any other info..." rows={3} data-testid="textarea-driver-notes" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button
              type="submit"
              className="w-full h-11"
              disabled={register.isPending}
              data-testid="btn-submit-driver"
            >
              {register.isPending ? "Submitting..." : "Submit Driver Registration"}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
