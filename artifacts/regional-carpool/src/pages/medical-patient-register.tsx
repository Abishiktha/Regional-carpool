import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useRegisterMedicalPatient } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListMedicalPatientsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowLeft, Info } from "lucide-react";
import type { MedicalPatient } from "@workspace/api-client-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  dateOfBirth: z.string().min(1, "Date of birth required"),
  phone: z.string().min(8, "Phone number required"),
  address: z.string().min(3, "Street address required"),
  suburb: z.string().min(2, "Suburb required"),
  state: z.string().min(2, "State required"),
  postcode: z.string().min(4, "Postcode required"),
  medicareNumber: z.string().min(10, "Medicare number required (e.g. 1234 56789 1)"),
  gpName: z.string().min(2, "GP name required"),
  gpPhone: z.string().min(8, "GP phone required"),
  emergencyContactName: z.string().min(2, "Emergency contact name required"),
  emergencyContactPhone: z.string().min(8, "Emergency contact phone required"),
  mobilityNeeds: z.string().min(1, "Please select your mobility needs"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const STATES = ["QLD", "NSW", "VIC", "SA", "WA", "NT", "TAS", "ACT"];
const MOBILITY_OPTIONS = [
  { value: "Walk independently", label: "Walk independently" },
  { value: "Walking frame / walker", label: "Walking frame / walker" },
  { value: "Wheelchair user", label: "Wheelchair user" },
  { value: "Stretcher required", label: "Stretcher required" },
];

export default function MedicalPatientRegister() {
  const [submitted, setSubmitted] = useState<MedicalPatient | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const register = useRegisterMedicalPatient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "", dateOfBirth: "", phone: "", address: "", suburb: "",
      state: "", postcode: "", medicareNumber: "", gpName: "", gpPhone: "",
      emergencyContactName: "", emergencyContactPhone: "", mobilityNeeds: "", notes: "",
    },
  });

  function onSubmit(values: FormValues) {
    register.mutate({ data: values }, {
      onSuccess: (patient) => {
        queryClient.invalidateQueries({ queryKey: getListMedicalPatientsQueryKey() });
        setSubmitted(patient);
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
          <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-teal-700" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Registration Submitted</h1>
          <p className="text-muted-foreground mb-6">Your application has been received and is now pending verification.</p>
          <div className="rounded-xl border bg-card p-5 text-left mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Patient ID</span>
              <span className="font-mono font-bold text-lg text-primary" data-testid="text-patient-id">#{submitted.id}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Name</span>
              <span className="text-sm text-foreground">{submitted.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Status</span>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-200" data-testid="badge-verification-status">Pending Verification</Badge>
            </div>
          </div>
          <div className="rounded-lg bg-teal-50 border border-teal-200 p-4 text-sm text-teal-800 text-left mb-6">
            <p className="font-semibold mb-1">What happens next?</p>
            <p>Our team will verify your Medicare number and contact details within <strong>1–2 business days</strong>. Once approved, you'll be able to book transport to your medical appointments.</p>
            <p className="mt-2">Save your Patient ID <strong>#{submitted.id}</strong> — you'll need it to book transport.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/medical">
              <Button variant="outline" data-testid="btn-back-to-medical">Back to Medical Transport</Button>
            </Link>
            <Link href="/medical/transport/new">
              <Button className="bg-teal-700 hover:bg-teal-800 text-white" data-testid="btn-book-now">Book Transport</Button>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Patient Registration</h1>
        <p className="text-muted-foreground mb-8">Register to access medical transport services. Your details will be kept confidential and used only for transport coordination.</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Personal Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Margaret Thompson" data-testid="input-full-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" data-testid="input-dob" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="0412 345 678" data-testid="input-phone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Home Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Street Address</FormLabel>
                    <FormControl><Input placeholder="14 Wattle St" data-testid="input-address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="suburb" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suburb</FormLabel>
                    <FormControl><Input placeholder="Dubbo" data-testid="input-suburb" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="postcode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl><Input placeholder="2830" maxLength={4} data-testid="input-postcode" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Medical Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="medicareNumber" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="flex items-center gap-1.5">
                      Medicare Number
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                        <Info className="w-3 h-3" /> Used for service verification only
                      </span>
                    </FormLabel>
                    <FormControl><Input placeholder="1234 56789 1" data-testid="input-medicare" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gpName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GP / Doctor Name</FormLabel>
                    <FormControl><Input placeholder="Dr. John Smith" data-testid="input-gp-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gpPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GP / Doctor Phone</FormLabel>
                    <FormControl><Input placeholder="02 6800 1234" data-testid="input-gp-phone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mobilityNeeds" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Mobility Needs</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-mobility">
                          <SelectValue placeholder="Select mobility needs" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOBILITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b">Emergency Contact</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl><Input placeholder="Susan Thompson" data-testid="input-emergency-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl><Input placeholder="0423 456 789" data-testid="input-emergency-phone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (optional)</FormLabel>
                <FormControl><Textarea placeholder="Any special requirements or information for drivers..." rows={3} data-testid="textarea-notes" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white h-11"
              disabled={register.isPending}
              data-testid="btn-submit-patient"
            >
              {register.isPending ? "Submitting..." : "Submit Registration"}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
