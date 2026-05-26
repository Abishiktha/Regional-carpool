import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import {
  useGetMedicalPatient,
  useListMedicalTransportRequests,
  useListRecurringAppointments,
  useListNotifications,
  useCancelMedicalTransportRequest,
  getListMedicalTransportRequestsQueryKey,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import type { MedicalPatient, MedicalTransportRequest, RecurringAppointment, NotificationEntry } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  UserCircle2,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
  MapPin,
  Car,
  RepeatIcon,
  Bell,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Ban,
} from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function verificationBadge(status: string) {
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 border border-green-200 rounded-full px-3 py-1 text-sm font-semibold">
      <CheckCircle2 className="w-4 h-4" /> Verified & Active
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 border border-red-200 rounded-full px-3 py-1 text-sm font-semibold">
      <XCircle className="w-4 h-4" /> Registration Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-3 py-1 text-sm font-semibold">
      <Clock className="w-4 h-4" /> Pending Verification
    </span>
  );
}

function transportStatusBadge(status: string) {
  if (status === "assigned") return <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">Driver Assigned</Badge>;
  if (status === "completed") return <Badge className="bg-slate-100 text-slate-600 border-slate-200 border text-xs">Completed</Badge>;
  if (status === "cancelled") return <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs">Cancelled</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200 border text-xs">Pending Assignment</Badge>;
}

function isUpcoming(tripDate: string) {
  return new Date(tripDate + "T00:00:00") >= new Date(new Date().toDateString());
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function frequencyLabel(weeks: number) {
  if (weeks === 1) return "Weekly";
  if (weeks === 2) return "Fortnightly";
  if (weeks === 4) return "Monthly";
  return `Every ${weeks} weeks`;
}

// ── Section components ───────────────────────────────────────────────────────

function PatientCard({ patient }: { patient: MedicalPatient }) {
  return (
    <div className="rounded-2xl border bg-card p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center shrink-0">
          <UserCircle2 className="w-8 h-8 text-teal-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground">{patient.fullName}</h2>
          <p className="text-sm text-muted-foreground">{patient.address}, {patient.suburb} {patient.postcode}</p>
          <p className="text-sm text-muted-foreground">{patient.phone}</p>
        </div>
        <div className="shrink-0">
          {verificationBadge(patient.verificationStatus)}
        </div>
      </div>
      {patient.verificationStatus === "rejected" && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">Your registration was not approved. Please contact your regional coordinator for more information.</p>
        </div>
      )}
      {patient.verificationStatus === "pending" && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Your registration is being reviewed. You'll receive a notification when it's approved. This usually takes 1–2 business days.</p>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Patient ID</p>
          <p className="font-bold text-foreground">#{patient.id}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Date of Birth</p>
          <p className="font-semibold text-foreground text-sm">{patient.dateOfBirth}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Medicare No.</p>
          <p className="font-semibold text-foreground text-sm">{patient.medicareNumber}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-0.5">GP</p>
          <p className="font-semibold text-foreground text-sm truncate">{patient.gpName}</p>
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, patientId }: { trip: MedicalTransportRequest; patientId: number }) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const { mutate: cancelTrip, isPending: cancelling } = useCancelMedicalTransportRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicalTransportRequestsQueryKey({ patientId }) });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ recipientType: "patient", recipientId: patientId }) });
        setConfirming(false);
        setReason("");
      },
    },
  });

  const upcoming = isUpcoming(trip.tripDate);
  const cancellable = upcoming && trip.status !== "completed" && trip.status !== "cancelled";

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${!upcoming || trip.status === "cancelled" ? "opacity-70" : ""}`}>
      <div className="p-4 flex items-start gap-3">
        <div className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${upcoming && trip.status !== "cancelled" ? "bg-teal-50 border border-teal-200" : "bg-muted"}`}>
          {trip.status === "cancelled"
            ? <Ban className="w-4 h-4 text-muted-foreground" />
            : <Car className={`w-4 h-4 ${upcoming ? "text-teal-700" : "text-muted-foreground"}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {transportStatusBadge(trip.status)}
            {trip.returnTrip && <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-xs">Return trip</Badge>}
          </div>
          <p className="font-semibold text-foreground text-sm">{trip.pickupSuburb} → {trip.destinationName}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatDate(trip.tripDate)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trip.tripTime}</span>
          </div>
          {trip.assignedDriverName && trip.status !== "cancelled" && (
            <p className="text-xs text-green-700 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Driver: {trip.assignedDriverName}
            </p>
          )}
          {upcoming && trip.status === "pending" && (
            <p className="text-xs text-amber-700 mt-1">A coordinator will assign a driver shortly.</p>
          )}
        </div>
        {cancellable && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="shrink-0 text-xs text-muted-foreground hover:text-red-600 underline underline-offset-2 transition-colors mt-1"
          >
            Cancel booking
          </button>
        )}
      </div>

      {/* Inline cancel confirmation */}
      {confirming && (
        <div className="border-t bg-red-50 border-red-100 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Cancel this booking?</p>
              <p className="text-xs text-red-700 mt-0.5">
                This will free your assigned driver and send cancellation notices.
                {trip.assignedDriverName && ` ${trip.assignedDriverName} will be notified.`}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-red-800 mb-1.5">
              Reason for cancelling <span className="font-normal text-red-600">(required)</span>
            </label>
            <Textarea
              placeholder="e.g. Appointment rescheduled, no longer need transport…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              className="text-sm resize-none bg-white border-red-200 focus-visible:ring-red-400"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={cancelling || reason.trim().length < 5}
              onClick={() => cancelTrip({ id: trip.id, data: { reason: reason.trim() } })}
              className="gap-1.5"
            >
              {cancelling
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling…</>
                : <><Ban className="w-3.5 h-3.5" /> Confirm cancellation</>}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={cancelling}
              onClick={() => { setConfirming(false); setReason(""); }}
            >
              Keep booking
            </Button>
          </div>
          {reason.trim().length > 0 && reason.trim().length < 5 && (
            <p className="text-xs text-red-600">Please enter at least 5 characters.</p>
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({ appt, patientId }: { appt: RecurringAppointment; patientId: number }) {
  const params = new URLSearchParams({
    patientId: String(patientId),
    appointmentId: String(appt.id),
    destinationName: appt.clinicName,
    destinationAddress: appt.clinicAddress,
    tripDate: appt.nextDate,
    tripTime: appt.appointmentTime,
  });

  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
        <RepeatIcon className="w-4 h-4 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm">{appt.clinicName}</p>
        <p className="text-xs text-muted-foreground">{appt.appointmentType} · {appt.dayOfWeek}s · {frequencyLabel(appt.frequencyWeeks)}</p>
        <p className="text-xs text-muted-foreground">Next: {formatDate(appt.nextDate)} at {appt.appointmentTime}</p>
      </div>
      <Link href={`/medical/transport/new?${params.toString()}`}>
        <Button size="sm" variant="outline" className="shrink-0 text-teal-700 border-teal-300 hover:bg-teal-50">
          Book <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

function NotifRow({ n }: { n: NotificationEntry }) {
  const [open, setOpen] = useState(false);
  const date = new Date(n.createdAt);
  const dateStr = date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  const timeStr = date.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  const eventColor = n.event.includes("approved")
    ? "text-green-700"
    : n.event.includes("rejected")
    ? "text-red-600"
    : "text-teal-700";

  return (
    <div className="border-b last:border-0 py-3">
      <button className="w-full text-left flex items-start gap-3" onClick={() => setOpen(!open)}>
        <Bell className={`w-4 h-4 shrink-0 mt-0.5 ${eventColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">{n.subject}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{dateStr} at {timeStr}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="ml-7 mt-2 rounded-lg bg-muted p-3">
          <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{n.message}</pre>
        </div>
      )}
    </div>
  );
}

// ── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({
  trips, appointments, notifications,
}: {
  trips: MedicalTransportRequest[];
  appointments: RecurringAppointment[];
  notifications: NotificationEntry[];
}) {
  const upcoming = trips.filter(t => isUpcoming(t.tripDate) && t.status !== "completed");
  const completed = trips.filter(t => t.status === "completed" || !isUpcoming(t.tripDate));
  const activeAppts = appointments.filter(a => a.active);

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      <div className="rounded-xl border bg-card p-4 text-center">
        <div className="text-2xl font-bold text-teal-700">{upcoming.length}</div>
        <div className="text-xs text-muted-foreground mt-0.5">Upcoming trips</div>
      </div>
      <div className="rounded-xl border bg-card p-4 text-center">
        <div className="text-2xl font-bold text-foreground">{activeAppts.length}</div>
        <div className="text-xs text-muted-foreground mt-0.5">Recurring appts</div>
      </div>
      <div className="rounded-xl border bg-card p-4 text-center">
        <div className="text-2xl font-bold text-slate-500">{completed.length}</div>
        <div className="text-xs text-muted-foreground mt-0.5">Past trips</div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function PatientPortal() {
  const [idInput, setIdInput] = useState("");
  const [patientId, setPatientId] = useState<number | null>(null);

  const { data: patient, isLoading: patientLoading, isError: patientError } = useGetMedicalPatient(
    patientId ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: patientId !== null } as any }
  );
  const { data: trips, isLoading: tripsLoading } = useListMedicalTransportRequests(
    patientId !== null ? { patientId } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: patientId !== null } as any }
  );
  const { data: appointments, isLoading: apptsLoading } = useListRecurringAppointments(
    patientId !== null ? { patientId } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: patientId !== null } as any }
  );
  const { data: notifications, isLoading: notifsLoading } = useListNotifications(
    patientId !== null ? { recipientType: "patient", recipientId: patientId } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: patientId !== null } as any }
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(idInput.trim(), 10);
    if (!isNaN(id) && id > 0) setPatientId(id);
  }

  const upcomingTrips = trips?.filter(t => isUpcoming(t.tripDate) && t.status !== "completed")
    .sort((a, b) => a.tripDate.localeCompare(b.tripDate)) ?? [];
  const pastTrips = trips?.filter(t => !isUpcoming(t.tripDate) || t.status === "completed")
    .sort((a, b) => b.tripDate.localeCompare(a.tripDate)) ?? [];
  const activeAppts = appointments?.filter(a => a.active) ?? [];
  const recentNotifs = [...(notifications ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isDataLoading = patientLoading || tripsLoading || apptsLoading || notifsLoading;

  return (
    <Layout>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 mb-4">
          <UserCircle2 className="w-3.5 h-3.5" />
          Patient Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Patient Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          View your registration status, upcoming trips, appointment schedule, and messages — all in one place.
        </p>
      </div>

      {/* ID lookup */}
      <form onSubmit={handleSearch} className="rounded-2xl border bg-card p-6 mb-8">
        <label className="block text-sm font-semibold text-foreground mb-2">Enter your Patient ID to access your dashboard</label>
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
            View Dashboard
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Your Patient ID was shown on screen when you completed your registration.{" "}
          <Link href="/medical/register/patient" className="text-teal-700 underline underline-offset-2">Register as a patient</Link> if you haven't yet.
        </p>
      </form>

      {patientId !== null && (
        <>
          {isDataLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
              {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : patientError || !patient ? (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Patient not found</p>
              <p className="text-sm mt-1">No patient registered with ID #{patientId}. Please check your ID and try again.</p>
            </div>
          ) : (
            <>
              {/* Patient card */}
              <PatientCard patient={patient} />

              {/* Stats */}
              <StatsBar
                trips={trips ?? []}
                appointments={appointments ?? []}
                notifications={notifications ?? []}
              />

              {/* Quick actions (only for approved patients) */}
              {patient.verificationStatus === "approved" && (
                <div className="grid sm:grid-cols-2 gap-3 mb-8">
                  <Link href="/medical/transport/new">
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                        <ClipboardList className="w-5 h-5 text-teal-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Book new transport</p>
                        <p className="text-xs text-muted-foreground">Request a verified driver</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </div>
                  </Link>
                  <Link href="/medical/appointments">
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                        <RepeatIcon className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Manage appointments</p>
                        <p className="text-xs text-muted-foreground">Add or view recurring trips</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </div>
                  </Link>
                </div>
              )}

              {/* Upcoming trips */}
              <section className="mb-8">
                <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-teal-700" />
                  Upcoming Trips
                  {upcomingTrips.length > 0 && (
                    <span className="ml-1 bg-teal-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {upcomingTrips.length}
                    </span>
                  )}
                </h3>
                {upcomingTrips.length === 0 ? (
                  <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
                    <Car className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No upcoming trips</p>
                    {patient.verificationStatus === "approved" && (
                      <Link href="/medical/transport/new">
                        <Button size="sm" className="mt-3 bg-teal-700 hover:bg-teal-800 text-white">
                          Book transport
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingTrips.map(t => <TripCard key={t.id} trip={t} patientId={patient.id} />)}
                  </div>
                )}
              </section>

              {/* Recurring appointments */}
              {activeAppts.length > 0 && (
                <section className="mb-8">
                  <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                    <RepeatIcon className="w-4 h-4 text-amber-700" />
                    Recurring Appointments
                  </h3>
                  <div className="space-y-2">
                    {activeAppts.map(a => (
                      <AppointmentRow key={a.id} appt={a} patientId={patientId} />
                    ))}
                  </div>
                </section>
              )}

              {/* Messages */}
              <section className="mb-8">
                <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-500" />
                  Messages
                  {recentNotifs.length > 0 && (
                    <span className="text-xs text-muted-foreground font-normal ml-1">{recentNotifs.length} total</span>
                  )}
                </h3>
                {recentNotifs.length === 0 ? (
                  <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
                    <Bell className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs mt-1">You'll receive messages here when your registration is reviewed.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-card px-4 divide-y">
                    {recentNotifs.map(n => <NotifRow key={n.id} n={n} />)}
                  </div>
                )}
              </section>

              {/* Past trips (collapsible) */}
              {pastTrips.length > 0 && (
                <section className="mb-8">
                  <details className="group">
                    <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-muted-foreground list-none select-none mb-3">
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                      Past Trips ({pastTrips.length})
                    </summary>
                    <div className="space-y-2">
                      {pastTrips.map(t => <TripCard key={t.id} trip={t} patientId={patient.id} />)}
                    </div>
                  </details>
                </section>
              )}
            </>
          )}
        </>
      )}
    </Layout>
  );
}
