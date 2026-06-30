import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import {
  useGetMedicalDriver,
  useListMedicalTransportRequests,
  useListNotifications,
  useCompleteMedicalTransportRequest,
  useGetDriverAvailability,
  useSetDriverAvailability,
  getGetDriverAvailabilityQueryKey,
  getListMedicalTransportRequestsQueryKey,
} from "@workspace/api-client-react";
import type { MedicalDriver, MedicalTransportRequest, NotificationEntry } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Car,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
  MapPin,
  User,
  Phone,
  AlertCircle,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Accessibility,
  ArrowRight,
  ClipboardList,
  Shield,
  Flag,
  Loader2,
  TrendingUp,
  BarChart3,
  Info,
  RotateCcw,
} from "lucide-react";

// ── Calendar helpers ─────────────────────────────────────────────────────────

function calWeekStart(anchor: Date): string {
  const d = new Date(anchor);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7)); // Monday
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function calAddDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function calFmtWeek(ws: string) {
  const start = new Date(ws + "T00:00:00");
  const end = new Date(ws + "T00:00:00");
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-AU", opts)} – ${end.toLocaleDateString("en-AU", { ...opts, year: "numeric" })}`;
}

// ── Availability calendar ─────────────────────────────────────────────────────

function AvailabilityCalendar({ driverId }: { driverId: number }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const weekStart = calWeekStart(anchor);
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useGetDriverAvailability(
    { driverId, weekStart },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: {} as any }
  );

  const setAvail = useSetDriverAvailability();

  const availMap: Record<string, boolean> = {};
  for (const e of entries ?? []) availMap[e.date] = e.available;

  const days = Array.from({ length: 7 }, (_, i) => calAddDays(weekStart, i));
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().toISOString().slice(0, 10);
  const isCurrentWeek = weekStart === calWeekStart(new Date());

  function toggle(date: string) {
    const current = availMap[date];
    const next = current === true ? false : true;
    setAvail.mutate({ data: { driverId, date, available: next } }, {
      onSuccess: () => queryClient.invalidateQueries({
        queryKey: getGetDriverAvailabilityQueryKey({ driverId, weekStart }),
      }),
    });
  }

  function prevWeek() {
    const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d);
  }
  function nextWeek() {
    const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d);
  }

  return (
    <section className="mb-8">
      <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-indigo-600" />
        My Availability
      </h3>
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-xs text-muted-foreground mb-4">
          Mark which days you're available to drive. Coordinators can see this when assigning trips.
        </p>

        {/* Week navigation */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 rounded-lg border overflow-hidden">
            <button onClick={prevWeek} className="px-2 py-1.5 hover:bg-muted transition-colors" aria-label="Previous week">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-xs font-medium border-x min-w-[180px] text-center">{calFmtWeek(weekStart)}</span>
            <button onClick={nextWeek} className="px-2 py-1.5 hover:bg-muted transition-colors" aria-label="Next week">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!isCurrentWeek && (
            <button onClick={() => setAnchor(new Date())} className="text-xs text-indigo-600 hover:underline">
              This week
            </button>
          )}
        </div>

        {/* 7-day grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((date, i) => {
              const avail = availMap[date];
              const isToday = date === today;
              const isPast = date < today;
              const isAvailable = avail === true;
              const isUnavailable = avail === false;

              return (
                <button
                  key={date}
                  onClick={() => !isPast && toggle(date)}
                  disabled={isPast || setAvail.isPending}
                  className={`
                    flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-all border
                    ${isPast ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"}
                    ${isAvailable ? "bg-green-50 border-green-300 text-green-800" : ""}
                    ${isUnavailable ? "bg-red-50 border-red-300 text-red-800" : ""}
                    ${!isAvailable && !isUnavailable ? "bg-muted/50 border-border text-muted-foreground" : ""}
                    ${isToday ? "ring-2 ring-indigo-400 ring-offset-1" : ""}
                  `}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{dayNames[i]}</span>
                  <span className="text-sm font-bold leading-none">{new Date(date + "T00:00:00").getDate()}</span>
                  <span className="text-[9px] leading-none mt-0.5">
                    {isAvailable ? "✓ Free" : isUnavailable ? "✗ Busy" : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" /> Unavailable</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted border inline-block" /> Not set</span>
          <span className="ml-auto italic">Tap a day to toggle</span>
        </div>
      </div>
    </section>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function verificationBadge(status: string) {
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 border border-green-200 rounded-full px-3 py-1 text-sm font-semibold">
      <CheckCircle2 className="w-4 h-4" /> Verified Driver
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

function tripStatusBadge(status: string) {
  if (status === "assigned") return <Badge className="bg-teal-100 text-teal-800 border-teal-200 border text-xs">Active — Assigned to you</Badge>;
  if (status === "completed") return <Badge className="bg-slate-100 text-slate-600 border-slate-200 border text-xs">Completed</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200 border text-xs">Pending</Badge>;
}

function isUpcoming(tripDate: string) {
  return new Date(tripDate + "T00:00:00") >= new Date(new Date().toDateString());
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short",
  });
}

// ── Driver card ──────────────────────────────────────────────────────────────

function DriverCard({ driver }: { driver: MedicalDriver }) {
  return (
    <div className="rounded-2xl border bg-card p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
        <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
          <Car className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground">{driver.fullName}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Phone className="w-3.5 h-3.5" />{driver.phone}
          </p>
        </div>
        <div className="shrink-0">{verificationBadge(driver.verificationStatus)}</div>
      </div>

      {driver.verificationStatus === "rejected" && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 mb-0.5">Registration not approved</p>
            <p className="text-sm text-red-700">
              {driver.rejectionReason ?? "Please contact your regional coordinator for more information."}
            </p>
          </div>
        </div>
      )}

      {driver.verificationStatus === "pending" && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Your registration is under review. A coordinator will contact you once your checks are verified. This typically takes 3–5 business days.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Driver ID</p>
          <p className="font-bold text-foreground">#{driver.id}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Vehicle</p>
          <p className="font-semibold text-foreground text-sm">{driver.vehicleType}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Rego</p>
          <p className="font-semibold text-foreground text-sm font-mono">{driver.vehicleRego}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Seats</p>
          <p className="font-semibold text-foreground text-sm">{driver.vehicleCapacity} passengers</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {driver.policeCheckDone && (
          <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
            <Shield className="w-3 h-3" /> Police Check
          </span>
        )}
        {driver.workingWithChildrenCheck && (
          <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
            <Shield className="w-3 h-3" /> Working with Children
          </span>
        )}
        {driver.hasWheelchairAccess && (
          <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">
            <Accessibility className="w-3 h-3" /> Wheelchair Accessible
          </span>
        )}
      </div>
    </div>
  );
}

// ── Trip card ────────────────────────────────────────────────────────────────

function TripCard({ trip, driverId }: { trip: MedicalTransportRequest; driverId: number }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();
  const { mutate: completeTrip, isPending: completing } = useCompleteMedicalTransportRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicalTransportRequestsQueryKey({ assignedDriverId: driverId }) });
        setConfirming(false);
      },
    },
  });

  const upcoming = isUpcoming(trip.tripDate);
  const isAssigned = trip.status === "assigned";

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${!upcoming ? "opacity-70" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/40 transition-colors"
      >
        <div className={`mt-0.5 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${upcoming ? "bg-teal-50 border border-teal-200" : "bg-muted border"}`}>
          <Car className={`w-5 h-5 ${upcoming ? "text-teal-700" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {tripStatusBadge(trip.status)}
            {trip.returnTrip && <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-xs">Return trip</Badge>}
          </div>
          <p className="font-semibold text-foreground text-sm">{trip.patientName}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{trip.pickupSuburb} → {trip.destinationName}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatDateShort(trip.tripDate)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Pickup {trip.tripTime}</span>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="border-t bg-muted/30 p-4 space-y-4">
          {/* Trip details */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Trip Details</h4>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="rounded-lg bg-card border p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Date</p>
                <p className="text-sm font-semibold text-foreground">{formatDate(trip.tripDate)}</p>
              </div>
              <div className="rounded-lg bg-card border p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Pickup time</p>
                <p className="text-sm font-semibold text-foreground">{trip.tripTime}</p>
              </div>
              {trip.returnTrip && trip.returnTime && (
                <div className="rounded-lg bg-card border p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Return pickup (approx.)</p>
                  <p className="text-sm font-semibold text-foreground">{trip.returnTime}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pickup address */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pickup Address</h4>
            <div className="rounded-lg bg-card border p-3 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{trip.pickupAddress}</p>
                <p className="text-sm text-muted-foreground">{trip.pickupSuburb}</p>
              </div>
            </div>
          </div>

          {/* Destination */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Destination</h4>
            <div className="rounded-lg bg-card border p-3 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{trip.destinationName}</p>
                <p className="text-sm text-muted-foreground">{trip.destinationAddress}</p>
              </div>
            </div>
          </div>

          {/* Patient */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Patient</h4>
            <div className="rounded-lg bg-card border p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{trip.patientName}</p>
                <p className="text-xs text-muted-foreground">Patient #{trip.patientId}</p>
              </div>
            </div>
          </div>

          {trip.notes && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</h4>
              <p className="text-sm text-foreground bg-card border rounded-lg p-3">{trip.notes}</p>
            </div>
          )}

          {/* Mark as complete — only for assigned upcoming trips */}
          {isAssigned && (
            <div className="pt-1">
              {!confirming ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50 gap-1.5"
                  onClick={() => setConfirming(true)}
                >
                  <Flag className="w-3.5 h-3.5" />
                  Mark trip as completed
                </Button>
              ) : (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-900 mb-1">Confirm trip completion</p>
                  <p className="text-xs text-green-800 mb-3">
                    This will mark the trip as completed and send a thank-you notification to the patient. You can't undo this.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-700 hover:bg-green-800 text-white gap-1.5"
                      disabled={completing}
                      onClick={() => completeTrip({ id: trip.id })}
                    >
                      {completing
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                        : <><CheckCircle2 className="w-3.5 h-3.5" /> Yes, mark as completed</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={completing}
                      onClick={() => setConfirming(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Notification row ─────────────────────────────────────────────────────────

function NotifRow({ n }: { n: NotificationEntry }) {
  const [open, setOpen] = useState(false);
  const date = new Date(n.createdAt);
  const dateStr = date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  const timeStr = date.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
  const eventColor = n.event.includes("approved") ? "text-green-700" : n.event.includes("rejected") ? "text-red-600" : "text-teal-700";

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

// ── Earnings summary ─────────────────────────────────────────────────────────

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}

function EarningsSummary({ trips }: { trips: MedicalTransportRequest[] }) {
  const [showLog, setShowLog] = useState(false);

  const completed = trips.filter(t => t.status === "completed").sort((a, b) => b.tripDate.localeCompare(a.tripDate));

  const thisMonthKey = getMonthKey(new Date().toISOString().slice(0, 10));
  const thisMonthTrips = completed.filter(t => getMonthKey(t.tripDate) === thisMonthKey);

  // Group by month for the breakdown chart
  const byMonth: Record<string, MedicalTransportRequest[]> = {};
  for (const t of completed) {
    const k = getMonthKey(t.tripDate);
    if (!byMonth[k]) byMonth[k] = [];
    byMonth[k].push(t);
  }
  const monthKeys = Object.keys(byMonth).sort().reverse().slice(0, 6);
  const maxInMonth = Math.max(...monthKeys.map(k => byMonth[k].length), 1);

  const returnTripCount = completed.filter(t => t.returnTrip).length;

  if (completed.length === 0) {
    return (
      <section className="mb-8">
        <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Trip Summary &amp; Earnings
        </h3>
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <TrendingUp className="w-7 h-7 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No completed trips yet</p>
          <p className="text-xs mt-1">Your trip history and earnings summary will appear here once you've completed your first trip.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        Trip Summary &amp; Earnings
      </h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">All-time trips</p>
          <p className="text-2xl font-bold text-foreground">{completed.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">completed</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">This month</p>
          <p className="text-2xl font-bold text-primary">{thisMonthTrips.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">trips completed</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Return trips</p>
          <p className="text-2xl font-bold text-blue-600">{returnTripCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">included returns</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Active months</p>
          <p className="text-2xl font-bold text-slate-600">{Object.keys(byMonth).length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">months driven</p>
        </div>
      </div>

      {/* Monthly bar chart */}
      {monthKeys.length > 1 && (
        <div className="rounded-xl border bg-card p-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Trips per month (last 6 months)</p>
          <div className="flex items-end gap-2 h-20">
            {monthKeys.map(k => {
              const count = byMonth[k].length;
              const heightPct = Math.round((count / maxInMonth) * 100);
              const isCurrent = k === thisMonthKey;
              return (
                <div key={k} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground">{count}</span>
                  <div className="w-full rounded-t-md" style={{ height: `${Math.max(heightPct, 8)}%`, backgroundColor: isCurrent ? "hsl(var(--primary))" : "hsl(var(--muted))", opacity: isCurrent ? 1 : 0.7 }} />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {new Date(k + "-01").toLocaleDateString("en-AU", { month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment note */}
      <div className="rounded-xl border bg-blue-50 border-blue-200 p-3 flex gap-2 mb-4">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          <strong>Payment is managed by your regional coordinator.</strong> Each completed trip is logged here and reconciled monthly. Contact your coordinator if you have questions about a specific trip payment.
        </p>
      </div>

      {/* Per-trip log toggle */}
      <button
        onClick={() => setShowLog(!showLog)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 select-none"
      >
        {showLog ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        View full trip log ({completed.length} trips)
      </button>

      {showLog && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-[90px_1fr_140px_80px_90px] gap-3 px-4 py-2 bg-muted border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Date</span>
            <span>Route</span>
            <span>Patient</span>
            <span>Return</span>
            <span className="text-right">Status</span>
          </div>
          <div className="divide-y">
            {completed.map(t => (
              <div key={t.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                {/* Mobile layout */}
                <div className="sm:hidden flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{formatDateShort(t.tripDate)}</p>
                    <p className="text-sm font-medium text-foreground truncate">{t.pickupSuburb} → {t.destinationName}</p>
                    <p className="text-xs text-muted-foreground">{t.patientName.split(" ")[0]} {t.patientName.split(" ").slice(-1)[0]?.[0]}.</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {t.returnTrip && <RotateCcw className="w-3 h-3 text-blue-500" />}
                    <span className="text-xs text-green-700 font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Logged</span>
                  </div>
                </div>
                {/* Desktop layout */}
                <div className="hidden sm:grid grid-cols-[90px_1fr_140px_80px_90px] gap-3 items-center">
                  <span className="text-xs text-muted-foreground">{formatDateShort(t.tripDate)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.pickupSuburb}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 shrink-0" />{t.destinationName}
                    </p>
                  </div>
                  <span className="text-sm text-foreground truncate">
                    {t.patientName.split(" ")[0]} {t.patientName.split(" ").slice(-1)[0]?.[0]}.
                  </span>
                  <span className="text-center">
                    {t.returnTrip
                      ? <RotateCcw className="w-3.5 h-3.5 text-blue-500 mx-auto" aria-label="Includes return" />
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </span>
                  <span className="text-right">
                    <span className="text-xs text-green-700 font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Logged</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ trips }: { trips: MedicalTransportRequest[] }) {
  const upcoming = trips.filter(t => t.status === "assigned" && isUpcoming(t.tripDate));
  const completed = trips.filter(t => t.status === "completed" || (!isUpcoming(t.tripDate) && t.status === "assigned"));
  const returnTrips = trips.filter(t => t.returnTrip && isUpcoming(t.tripDate));

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      <div className="rounded-xl border bg-card p-4 text-center">
        <div className="text-2xl font-bold text-teal-700">{upcoming.length}</div>
        <div className="text-xs text-muted-foreground mt-0.5">Upcoming trips</div>
      </div>
      <div className="rounded-xl border bg-card p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{returnTrips.length}</div>
        <div className="text-xs text-muted-foreground mt-0.5">With return trip</div>
      </div>
      <div className="rounded-xl border bg-card p-4 text-center">
        <div className="text-2xl font-bold text-slate-500">{completed.length}</div>
        <div className="text-xs text-muted-foreground mt-0.5">Trips completed</div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function DriverPortal() {
  const [idInput, setIdInput] = useState("");
  const [driverId, setDriverId] = useState<number | null>(null);

  const { data: driver, isLoading: driverLoading, isError: driverError } = useGetMedicalDriver(
    driverId ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: driverId !== null } as any }
  );
  const { data: trips, isLoading: tripsLoading } = useListMedicalTransportRequests(
    driverId !== null ? { assignedDriverId: driverId } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: driverId !== null } as any }
  );
  const { data: notifications, isLoading: notifsLoading } = useListNotifications(
    driverId !== null ? { recipientType: "driver", recipientId: driverId } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: driverId !== null } as any }
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(idInput.trim(), 10);
    if (!isNaN(id) && id > 0) setDriverId(id);
  }

  const upcomingTrips = (trips ?? [])
    .filter(t => t.status === "assigned" && isUpcoming(t.tripDate))
    .sort((a, b) => a.tripDate.localeCompare(b.tripDate));

  const pastTrips = (trips ?? [])
    .filter(t => t.status === "completed" || (!isUpcoming(t.tripDate) && t.status === "assigned"))
    .sort((a, b) => b.tripDate.localeCompare(a.tripDate));

  const recentNotifs = [...(notifications ?? [])].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const isDataLoading = driverLoading || tripsLoading || notifsLoading;

  return (
    <Layout>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4">
          <Car className="w-3.5 h-3.5" />
          Driver Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Driver Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          View your registration status, upcoming trips, and full patient/pickup details for each booking.
        </p>
      </div>

      {/* ID lookup */}
      <form onSubmit={handleSearch} className="rounded-2xl border bg-card p-6 mb-8">
        <label className="block text-sm font-semibold text-foreground mb-2">Enter your Driver ID to access your dashboard</label>
        <div className="flex gap-2">
          <Input
            placeholder="Driver ID number (e.g. 3)"
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
          Your Driver ID was shown on screen when you completed your registration.{" "}
          <Link href="/medical/register/driver" className="text-primary underline underline-offset-2">Register as a driver</Link> if you haven't yet.
        </p>
      </form>

      {driverId !== null && (
        <>
          {isDataLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
              {[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : driverError || !driver ? (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Driver not found</p>
              <p className="text-sm mt-1">No driver registered with ID #{driverId}. Please check your ID and try again.</p>
            </div>
          ) : (
            <>
              <DriverCard driver={driver} />

              {driver.verificationStatus === "approved" && (
                <>
                  <StatsBar trips={trips ?? []} />

                  <EarningsSummary trips={trips ?? []} />

                  <AvailabilityCalendar driverId={driver.id} />

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
                      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                        <ClipboardList className="w-7 h-7 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No upcoming trips assigned yet</p>
                        <p className="text-sm mt-1">A coordinator will assign trips to you when patients in your area need transport. You'll receive a notification when that happens.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {upcomingTrips.map(t => <TripCard key={t.id} trip={t} driverId={driverId} />)}
                      </div>
                    )}
                  </section>

                  {/* Guidance for active drivers */}
                  {upcomingTrips.length > 0 && (
                    <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex gap-3 mb-8">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <strong>Trip reminders: </strong>
                        Arrive at the pickup address 5–10 minutes early. If there are any issues on the day, contact your regional coordinator as soon as possible. Patient details are shown when you expand each trip above.
                      </div>
                    </div>
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
                        <p className="text-xs mt-1">You'll receive messages here when your registration is reviewed or a trip is assigned to you.</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border bg-card px-4 divide-y">
                        {recentNotifs.map(n => <NotifRow key={n.id} n={n} />)}
                      </div>
                    )}
                  </section>

                  {/* Past trips */}
                  {pastTrips.length > 0 && (
                    <section className="mb-8">
                      <details className="group">
                        <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-muted-foreground list-none select-none mb-3">
                          <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                          Past Trips ({pastTrips.length})
                        </summary>
                        <div className="space-y-2">
                          {pastTrips.map(t => <TripCard key={t.id} trip={t} driverId={driverId} />)}
                        </div>
                      </details>
                    </section>
                  )}
                </>
              )}

              {/* Not yet approved — show messages only */}
              {driver.verificationStatus !== "approved" && recentNotifs.length > 0 && (
                <section className="mb-8">
                  <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500" />
                    Messages
                  </h3>
                  <div className="rounded-xl border bg-card px-4 divide-y">
                    {recentNotifs.map(n => <NotifRow key={n.id} n={n} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </Layout>
  );
}
