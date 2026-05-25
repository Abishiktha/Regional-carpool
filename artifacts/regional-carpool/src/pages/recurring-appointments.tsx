import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import {
  useListRecurringAppointments,
  useCreateRecurringAppointment,
  useDeleteRecurringAppointment,
  getListRecurringAppointmentsQueryKey,
} from "@workspace/api-client-react";
import type { RecurringAppointment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Search,
  Trash2,
  RepeatIcon,
  Stethoscope,
  ArrowRight,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

const APPOINTMENT_TYPES = [
  "GP Visit",
  "Dialysis",
  "Specialist Consultation",
  "Physiotherapy",
  "Chemotherapy",
  "Oncology",
  "Cardiology",
  "Ophthalmology",
  "Allied Health",
  "Mental Health",
  "Dental",
  "Radiology / Imaging",
  "Other",
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const FREQUENCY_OPTIONS = [
  { value: 1, label: "Every week" },
  { value: 2, label: "Every 2 weeks (fortnightly)" },
  { value: 3, label: "Every 3 weeks" },
  { value: 4, label: "Every 4 weeks (monthly)" },
];

function frequencyLabel(weeks: number) {
  return FREQUENCY_OPTIONS.find(f => f.value === weeks)?.label ?? `Every ${weeks} weeks`;
}

function dayAbbr(day: string) {
  return day.slice(0, 3);
}

// ── Transport request URL builder ───────────────────────────────────────────

function buildTransportUrl(appt: RecurringAppointment, patientId: number) {
  const params = new URLSearchParams({
    patientId: String(patientId),
    appointmentId: String(appt.id),
    destinationName: appt.clinicName,
    destinationAddress: appt.clinicAddress,
    tripDate: appt.nextDate,
    tripTime: appt.appointmentTime,
  });
  return `/medical/transport/new?${params.toString()}`;
}

// ── Appointment card ────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  patientId,
  onDeactivate,
}: {
  appt: RecurringAppointment;
  patientId: number;
  onDeactivate: (id: number) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className={`rounded-xl border bg-card p-5 ${!appt.active ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-teal-700" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-bold text-foreground">{appt.clinicName}</span>
              {!appt.active && <Badge className="bg-slate-100 text-slate-500 border-slate-200 border text-xs">Inactive</Badge>}
            </div>
            <Badge className="bg-teal-50 text-teal-700 border-teal-200 border text-xs mb-1">{appt.appointmentType}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{appt.clinicAddress}, {appt.clinicSuburb}</span>
            </div>
          </div>
        </div>
        {appt.active && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 mt-1"
            title="Deactivate appointment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-muted px-3 py-2">
          <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Schedule
          </div>
          <div className="text-sm font-semibold text-foreground">{dayAbbr(appt.dayOfWeek)}s · {frequencyLabel(appt.frequencyWeeks)}</div>
        </div>
        <div className="rounded-lg bg-muted px-3 py-2">
          <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Time
          </div>
          <div className="text-sm font-semibold text-foreground">{appt.appointmentTime}</div>
        </div>
        <div className="rounded-lg bg-muted px-3 py-2 col-span-2 sm:col-span-1">
          <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
            <RepeatIcon className="w-3 h-3" /> Next trip
          </div>
          <div className="text-sm font-semibold text-foreground">
            {new Date(appt.nextDate + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      {appt.notes && (
        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mb-3">{appt.notes}</p>
      )}

      {appt.active && (
        <Link href={buildTransportUrl(appt, patientId)}>
          <Button size="sm" className="w-full bg-teal-700 hover:bg-teal-800 text-white">
            Book Transport for Next Trip
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate this appointment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will stop generating transport requests for <strong>{appt.clinicName}</strong> ({appt.appointmentType}). You can add it again later if needed.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { onDeactivate(appt.id); setConfirmOpen(false); }}
            >
              Yes, deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Add appointment form ────────────────────────────────────────────────────

interface AddFormProps {
  patientId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddAppointmentForm({ patientId, onSuccess, onCancel }: AddFormProps) {
  const { toast } = useToast();
  const create = useCreateRecurringAppointment();

  const [form, setForm] = useState({
    clinicName: "",
    clinicAddress: "",
    clinicSuburb: "",
    appointmentType: "",
    customType: "",
    dayOfWeek: "",
    appointmentTime: "",
    frequencyWeeks: 2,
    nextDate: "",
    notes: "",
  });

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const appointmentType = form.appointmentType === "Other" ? form.customType : form.appointmentType;
    if (!appointmentType) { toast({ title: "Please specify the appointment type.", variant: "destructive" }); return; }

    create.mutate({
      data: {
        patientId,
        clinicName: form.clinicName,
        clinicAddress: form.clinicAddress,
        clinicSuburb: form.clinicSuburb,
        appointmentType,
        dayOfWeek: form.dayOfWeek,
        appointmentTime: form.appointmentTime,
        frequencyWeeks: Number(form.frequencyWeeks),
        nextDate: form.nextDate,
        notes: form.notes || undefined,
      },
    }, {
      onSuccess: () => {
        toast({ title: "Appointment added", description: "Your recurring appointment has been saved." });
        onSuccess();
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Plus className="w-4 h-4 text-teal-700" />
        <h3 className="font-bold text-foreground">Add recurring appointment</h3>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Clinic / hospital name *</label>
          <Input
            placeholder="e.g. Dubbo Base Hospital"
            value={form.clinicName}
            onChange={e => set("clinicName", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Appointment type *</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.appointmentType}
            onChange={e => set("appointmentType", e.target.value)}
            required
          >
            <option value="">Select type…</option>
            {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {form.appointmentType === "Other" && (
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-foreground">Describe the appointment *</label>
            <Input
              placeholder="e.g. Wound care, Lymphoedema treatment…"
              value={form.customType}
              onChange={e => set("customType", e.target.value)}
              required
            />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Clinic street address *</label>
          <Input
            placeholder="e.g. 42 Macquarie St"
            value={form.clinicAddress}
            onChange={e => set("clinicAddress", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Suburb / town *</label>
          <Input
            placeholder="e.g. Dubbo"
            value={form.clinicSuburb}
            onChange={e => set("clinicSuburb", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Day of week *</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.dayOfWeek}
            onChange={e => set("dayOfWeek", e.target.value)}
            required
          >
            <option value="">Select day…</option>
            {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Appointment time *</label>
          <Input
            type="time"
            value={form.appointmentTime}
            onChange={e => set("appointmentTime", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">How often? *</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.frequencyWeeks}
            onChange={e => set("frequencyWeeks", Number(e.target.value))}
          >
            {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Next appointment date *</label>
        <Input
          type="date"
          value={form.nextDate}
          onChange={e => set("nextDate", e.target.value)}
          required
          min={new Date().toISOString().split("T")[0]}
        />
        <p className="text-xs text-muted-foreground">Enter the date of your next upcoming appointment.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Notes (optional)</label>
        <Textarea
          placeholder="e.g. Dialysis takes approx. 4 hours. Return transport needed."
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" className="flex-1 bg-teal-700 hover:bg-teal-800 text-white" disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Save Appointment"}
        </Button>
      </div>
    </form>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function RecurringAppointments() {
  const [idInput, setIdInput] = useState("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments, isLoading, isFetched } = useListRecurringAppointments(
    patientId !== null ? { patientId } : undefined,
    { query: { enabled: patientId !== null } }
  );

  const deactivate = useDeleteRecurringAppointment();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(idInput.trim(), 10);
    if (!isNaN(id) && id > 0) {
      setPatientId(id);
      setShowAdd(false);
    }
  }

  function handleDeactivate(id: number) {
    deactivate.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecurringAppointmentsQueryKey({ patientId: patientId! }) });
        toast({ title: "Appointment deactivated" });
      },
      onError: () => toast({ title: "Failed to deactivate", variant: "destructive" }),
    });
  }

  const active = appointments?.filter(a => a.active) ?? [];
  const inactive = appointments?.filter(a => !a.active) ?? [];

  return (
    <Layout>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 mb-4">
          <RepeatIcon className="w-3.5 h-3.5" />
          Recurring Appointments
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Recurring Appointments</h1>
        <p className="text-muted-foreground mt-1">
          Register your standing medical appointments — dialysis, specialist visits, and more — so you can quickly book transport each time.
        </p>
      </div>

      {/* Patient ID lookup */}
      <form onSubmit={handleSearch} className="rounded-2xl border bg-card p-6 mb-8">
        <label className="block text-sm font-semibold text-foreground mb-2">Enter your Patient ID to view or add appointments</label>
        <div className="flex gap-2">
          <Input
            placeholder="Patient ID number (e.g. 12)"
            value={idInput}
            onChange={e => setIdInput(e.target.value)}
            type="number"
            min="1"
            className="flex-1"
          />
          <Button type="submit" className="shrink-0">
            <Search className="w-4 h-4 mr-1.5" />
            Look Up
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Your Patient ID was shown on screen when you completed your registration. Don't have one yet?{" "}
          <Link href="/medical/register/patient" className="text-teal-700 underline underline-offset-2">Register as a patient</Link>.
        </p>
      </form>

      {patientId !== null && (
        <div className="space-y-6">
          {/* Add new appointment */}
          {showAdd ? (
            <AddAppointmentForm
              patientId={patientId}
              onSuccess={() => {
                setShowAdd(false);
                queryClient.invalidateQueries({ queryKey: getListRecurringAppointmentsQueryKey({ patientId }) });
              }}
              onCancel={() => setShowAdd(false)}
            />
          ) : (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Appointments for Patient #{patientId}
              </h2>
              <Button
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Appointment
              </Button>
            </div>
          )}

          {/* Appointment list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : !isFetched || (active.length === 0 && inactive.length === 0) ? (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              <CalendarDays className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No recurring appointments yet</p>
              <p className="text-sm mt-1">Add your first appointment using the button above.</p>
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <div className="space-y-3">
                  {active.map(a => (
                    <AppointmentCard key={a.id} appt={a} patientId={patientId} onDeactivate={handleDeactivate} />
                  ))}
                </div>
              )}

              {inactive.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-muted-foreground list-none select-none">
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                    {inactive.length} inactive appointment{inactive.length !== 1 ? "s" : ""}
                  </summary>
                  <div className="space-y-3 mt-3">
                    {inactive.map(a => (
                      <AppointmentCard key={a.id} appt={a} patientId={patientId} onDeactivate={handleDeactivate} />
                    ))}
                  </div>
                </details>
              )}
            </>
          )}

          {/* How it works callout */}
          <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>How to use: </strong>
              When your next appointment approaches, click <strong>Book Transport for Next Trip</strong> on the card above. The transport booking form will be pre-filled with your clinic details. A coordinator will then assign a verified driver.
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
