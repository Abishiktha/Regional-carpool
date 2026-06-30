import { useState } from "react";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  useListMedicalPatients,
  useVerifyMedicalPatient,
  useListMedicalDrivers,
  useVerifyMedicalDriver,
  useListMedicalTransportRequests,
  useAssignMedicalDriver,
  useUpdateCoordinatorNotes,
  useListNotifications,
  useListVerificationAuditLog,
  getListMedicalPatientsQueryKey,
  getListMedicalDriversQueryKey,
  getListMedicalTransportRequestsQueryKey,
} from "@workspace/api-client-react";
import type { MedicalPatient, MedicalDriver, MedicalTransportRequest, NotificationEntry, VerificationAuditLogEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, UserCheck, Car, ClipboardList, CheckCircle2, XCircle, MapPin, CalendarDays, Clock, AlertCircle, Bell, ChevronDown, ChevronRight, ChevronLeft, History, Search, Download, X, NotebookPen, Save, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";

function verificationBadge(status: string) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-800 border-red-200 border text-xs">Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200 border text-xs">Pending</Badge>;
}

function transportStatusBadge(status: string) {
  if (status === "cancelled") return <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs">Cancelled</Badge>;
  if (status === "assigned") return <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">Assigned</Badge>;
  if (status === "completed") return <Badge className="bg-slate-100 text-slate-600 border-slate-200 border text-xs">Completed</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200 border text-xs">Pending</Badge>;
}

// ── Patient verification panel ────────────────────────────────────────────────

function PatientRow({ patient, onAction }: { patient: MedicalPatient; onAction: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const verify = useVerifyMedicalPatient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  function approve() {
    verify.mutate({ id: patient.id, data: { status: "approved" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicalPatientsQueryKey() });
        toast({ title: "Patient approved", description: `${patient.fullName} can now book transport.` });
        onAction();
      },
      onError: () => toast({ title: "Failed", description: "Could not approve patient.", variant: "destructive" }),
    });
  }

  function reject() {
    verify.mutate({ id: patient.id, data: { status: "rejected", rejectionReason: reason } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicalPatientsQueryKey() });
        toast({ title: "Patient rejected" });
        setRejectOpen(false);
        onAction();
      },
      onError: () => toast({ title: "Failed", description: "Could not reject patient.", variant: "destructive" }),
    });
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-5" data-testid={`card-patient-${patient.id}`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{patient.fullName}</span>
              {verificationBadge(patient.verificationStatus)}
              <span className="text-xs text-muted-foreground font-mono">ID #{patient.id}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span><span className="font-medium text-foreground">DOB:</span> {patient.dateOfBirth}</span>
              <span><span className="font-medium text-foreground">Phone:</span> {patient.phone}</span>
              <span><span className="font-medium text-foreground">Suburb:</span> {patient.suburb}, {patient.state} {patient.postcode}</span>
              <span><span className="font-medium text-foreground">Medicare:</span> {patient.medicareNumber}</span>
              <span><span className="font-medium text-foreground">GP:</span> {patient.gpName} — {patient.gpPhone}</span>
              <span><span className="font-medium text-foreground">Emergency:</span> {patient.emergencyContactName} {patient.emergencyContactPhone}</span>
              <span className="sm:col-span-2"><span className="font-medium text-foreground">Mobility:</span> {patient.mobilityNeeds}</span>
              {patient.notes && <span className="sm:col-span-2"><span className="font-medium text-foreground">Notes:</span> {patient.notes}</span>}
            </div>
          </div>
          {patient.verificationStatus === "pending" && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                className="bg-green-700 hover:bg-green-800 text-white gap-1"
                onClick={approve}
                disabled={verify.isPending}
                data-testid={`btn-approve-patient-${patient.id}`}
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                onClick={() => setRejectOpen(true)}
                disabled={verify.isPending}
                data-testid={`btn-reject-patient-${patient.id}`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject patient registration</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Provide a reason for rejecting <strong>{patient.fullName}</strong>. This helps them understand what to correct.</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Medicare number could not be verified. Please re-register with a valid number."
            rows={3}
            data-testid="textarea-reject-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              className="bg-red-700 hover:bg-red-800 text-white"
              onClick={reject}
              disabled={verify.isPending || !reason.trim()}
              data-testid="btn-confirm-reject-patient"
            >
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Driver verification panel ─────────────────────────────────────────────────

function DriverRow({ driver, onAction }: { driver: MedicalDriver; onAction: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const verify = useVerifyMedicalDriver();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  function approve() {
    verify.mutate({ id: driver.id, data: { status: "approved" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicalDriversQueryKey() });
        toast({ title: "Driver approved", description: `${driver.fullName} can now be assigned to transport requests.` });
        onAction();
      },
      onError: () => toast({ title: "Failed", description: "Could not approve driver.", variant: "destructive" }),
    });
  }

  function reject() {
    verify.mutate({ id: driver.id, data: { status: "rejected", rejectionReason: reason } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicalDriversQueryKey() });
        toast({ title: "Driver rejected" });
        setRejectOpen(false);
        onAction();
      },
      onError: () => toast({ title: "Failed", description: "Could not reject driver.", variant: "destructive" }),
    });
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-5" data-testid={`card-driver-${driver.id}`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{driver.fullName}</span>
              {verificationBadge(driver.verificationStatus)}
              <span className="text-xs text-muted-foreground font-mono">ID #{driver.id}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span><span className="font-medium text-foreground">Phone:</span> {driver.phone}</span>
              <span><span className="font-medium text-foreground">License:</span> {driver.licenseNumber}</span>
              <span><span className="font-medium text-foreground">Vehicle:</span> {driver.vehicleType} — {driver.vehicleRego}</span>
              <span><span className="font-medium text-foreground">Capacity:</span> {driver.vehicleCapacity} passengers</span>
              <span className="flex items-center gap-1">
                {driver.hasWheelchairAccess
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  : <XCircle className="w-3.5 h-3.5 text-muted-foreground/50" />}
                Wheelchair access
              </span>
              <span className="flex items-center gap-1">
                {driver.policeCheckDone
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                Police check
              </span>
              <span className="flex items-center gap-1">
                {driver.workingWithChildrenCheck
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  : <XCircle className="w-3.5 h-3.5 text-muted-foreground/50" />}
                Working with Vulnerable People check
              </span>
              {driver.notes && <span className="sm:col-span-2"><span className="font-medium text-foreground">Notes:</span> {driver.notes}</span>}
            </div>
          </div>
          {driver.verificationStatus === "pending" && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                className="bg-green-700 hover:bg-green-800 text-white gap-1"
                onClick={approve}
                disabled={verify.isPending}
                data-testid={`btn-approve-driver-${driver.id}`}
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                onClick={() => setRejectOpen(true)}
                disabled={verify.isPending}
                data-testid={`btn-reject-driver-${driver.id}`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject driver registration</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Provide a reason for rejecting <strong>{driver.fullName}</strong>.</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Police check reference number could not be verified. Please resubmit with a current certificate."
            rows={3}
            data-testid="textarea-driver-reject-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              className="bg-red-700 hover:bg-red-800 text-white"
              onClick={reject}
              disabled={verify.isPending || !reason.trim()}
              data-testid="btn-confirm-reject-driver"
            >
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Weekly summary ────────────────────────────────────────────────────────────

function getWeekBounds(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor);
  const day = start.getDay(); // 0=Sun
  start.setDate(start.getDate() - ((day + 6) % 7)); // Monday
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Sunday
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

function fmtWeekLabel(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-AU", opts)} – ${end.toLocaleDateString("en-AU", { ...opts, year: "numeric" })}`;
}

function exportWeeklyCSV(rows: MedicalTransportRequest[], weekLabel: string) {
  const esc = (s: string | null | undefined) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const header = ["Date", "Patient", "Pickup Address", "Pickup Suburb", "Destination", "Dest. Address", "Pickup Time", "Return", "Return Time", "Driver", "Status", "Coordinator Notes"];
  const lines = rows.map(r => [
    esc(r.tripDate), esc(r.patientName), esc(r.pickupAddress), esc(r.pickupSuburb),
    esc(r.destinationName), esc(r.destinationAddress), esc(r.tripTime),
    r.returnTrip ? "Yes" : "No", esc(r.returnTime),
    esc(r.assignedDriverName), esc(r.status), esc(r.coordinatorNotes),
  ].join(","));
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = weekLabel.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  a.href = url; a.download = `transport-week-${slug}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function printWeeklySummary(rows: MedicalTransportRequest[], weekLabel: string) {
  const printedAt = new Date().toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" });
  const byDate: Record<string, MedicalTransportRequest[]> = {};
  for (const r of rows) {
    if (!byDate[r.tripDate]) byDate[r.tripDate] = [];
    byDate[r.tripDate].push(r);
  }
  const sortedDates = Object.keys(byDate).sort();

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: "#fef3c7;color:#92400e", assigned: "#dbeafe;color:#1e40af", completed: "#dcfce7;color:#166534", cancelled: "#fee2e2;color:#991b1b" };
    const style = map[s] ?? "#f3f4f6;color:#374151";
    return `<span style="background:${style};padding:1px 7px;border-radius:10px;font-size:10px;font-weight:700;text-transform:uppercase">${s}</span>`;
  };

  const dateSection = sortedDates.map(date => {
    const trips = byDate[date];
    const rows = trips.map(r => `
      <tr>
        <td>${r.tripTime}</td>
        <td><strong>${r.patientName}</strong></td>
        <td>${r.pickupSuburb} → ${r.destinationName}</td>
        <td>${r.assignedDriverName ?? "<em style='color:#999'>Unassigned</em>"}</td>
        <td>${statusBadge(r.status)}</td>
        <td style="font-size:10px;color:#555">${r.coordinatorNotes ?? ""}</td>
      </tr>`).join("");
    const d = new Date(date + "T00:00:00");
    const label = d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
    return `
      <div style="margin-bottom:24px">
        <div style="font-size:14px;font-weight:700;padding:6px 0;border-bottom:2px solid #1a1a1a;margin-bottom:8px">${label}</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f3f4f6;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:#555">
            <th style="padding:4px 6px;text-align:left;width:60px">Time</th>
            <th style="padding:4px 6px;text-align:left">Patient</th>
            <th style="padding:4px 6px;text-align:left">Route</th>
            <th style="padding:4px 6px;text-align:left">Driver</th>
            <th style="padding:4px 6px;text-align:left">Status</th>
            <th style="padding:4px 6px;text-align:left">Notes</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Weekly Transport Summary — ${weekLabel}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Georgia,serif; font-size:13px; color:#1a1a1a; padding:32px 40px; max-width:860px; margin:0 auto; }
  header { display:flex; align-items:flex-start; justify-content:space-between; padding-bottom:14px; border-bottom:3px solid #1a1a1a; margin-bottom:24px; }
  .brand { font-size:20px; font-weight:700; } .brand span { color:#c2410c; }
  .meta { text-align:right; font-size:11px; color:#555; line-height:1.6; }
  tbody tr:nth-child(even) { background:#fafafa; }
  tbody td { padding:5px 6px; border-bottom:1px solid #eee; vertical-align:top; }
  footer { margin-top:32px; padding-top:10px; border-top:1px solid #ddd; font-size:10px; color:#888; display:flex; justify-content:space-between; }
  @media print { body { padding:16px 24px; } }
</style>
</head><body>
<header>
  <div class="brand"><span>Regional</span> Carpool</div>
  <div class="meta"><strong>WEEKLY TRANSPORT SUMMARY</strong><br/>${weekLabel}<br/>Printed: ${printedAt}</div>
</header>
<p style="margin-bottom:20px;font-size:12px;color:#555">${rows.length} trip${rows.length !== 1 ? "s" : ""} scheduled this week</p>
${rows.length === 0 ? `<p style="color:#888;font-style:italic">No trips scheduled for this week.</p>` : dateSection}
<footer><span>Regional Carpool — Medical Transport Program</span><span>Generated ${printedAt}</span></footer>
<script>window.onload=function(){window.print();};<\/script>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function WeeklySummaryPanel({ requests }: { requests: MedicalTransportRequest[] }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const { start, end } = getWeekBounds(anchor);
  const weekLabel = fmtWeekLabel(start, end);

  const weekRows = requests
    .filter(r => r.tripDate >= toISO(start) && r.tripDate <= toISO(end))
    .sort((a, b) => a.tripDate.localeCompare(b.tripDate) || a.tripTime.localeCompare(b.tripTime));

  const byDate: Record<string, MedicalTransportRequest[]> = {};
  for (const r of weekRows) {
    if (!byDate[r.tripDate]) byDate[r.tripDate] = [];
    byDate[r.tripDate].push(r);
  }
  const sortedDates = Object.keys(byDate).sort();

  function prevWeek() { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d); }
  function nextWeek() { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d); }
  function thisWeek() { setAnchor(new Date()); }

  const isCurrentWeek = toISO(start) === toISO(getWeekBounds(new Date()).start);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <CalendarDays className="w-4 h-4 text-teal-700 flex-shrink-0" />
        <span className="font-semibold text-sm text-foreground flex-1">Weekly Summary</span>
        <span className="text-xs text-muted-foreground">{weekLabel}</span>
        <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
          {weekRows.length} trip{weekRows.length !== 1 ? "s" : ""}
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </div>

      {open && (
        <div className="border-t px-4 py-3 space-y-4">
          {/* Week navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg border overflow-hidden">
              <button onClick={prevWeek} className="px-2 py-1.5 hover:bg-muted transition-colors" aria-label="Previous week">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-xs font-medium text-foreground border-x min-w-[180px] text-center">{weekLabel}</span>
              <button onClick={nextWeek} className="px-2 py-1.5 hover:bg-muted transition-colors" aria-label="Next week">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {!isCurrentWeek && (
              <button onClick={thisWeek} className="text-xs text-teal-700 hover:underline">Today's week</button>
            )}
            <div className="ml-auto flex gap-2">
              {weekRows.length > 0 && (
                <>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => exportWeeklyCSV(weekRows, weekLabel)}>
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => printWeeklySummary(weekRows, weekLabel)}>
                    <Printer className="w-3.5 h-3.5" /> Print summary
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Grouped trips */}
          {weekRows.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No trips scheduled for {weekLabel}.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDates.map(date => {
                const d = new Date(date + "T00:00:00");
                const dayLabel = d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
                return (
                  <div key={date}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                      <span>{dayLabel}</span>
                      <span className="flex-1 border-t border-dashed border-border" />
                      <span className="text-teal-700">{byDate[date].length} trip{byDate[date].length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="space-y-1.5">
                      {byDate[date].map(r => (
                        <div key={r.id} className="flex items-start gap-3 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                          <span className="font-mono text-muted-foreground w-12 flex-shrink-0 pt-0.5">{r.tripTime}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground">{r.patientName}</div>
                            <div className="text-muted-foreground">{r.pickupSuburb} → {r.destinationName}</div>
                            {r.assignedDriverName && (
                              <div className="text-teal-700 flex items-center gap-1 mt-0.5">
                                <Car className="w-3 h-3" /> {r.assignedDriverName}
                              </div>
                            )}
                            {r.coordinatorNotes && (
                              <div className="text-indigo-700 flex items-start gap-1 mt-0.5">
                                <NotebookPen className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{r.coordinatorNotes}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">{transportStatusBadge(r.status)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Print trip sheet ─────────────────────────────────────────────────────────

function printTripSheet(r: MedicalTransportRequest) {
  const printedAt = new Date().toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" });
  const statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Trip Sheet — ${r.patientName} — ${r.tripDate}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; font-size: 13px; color: #1a1a1a; padding: 32px 40px; max-width: 720px; margin: 0 auto; }
  header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 16px; border-bottom: 3px solid #1a1a1a; margin-bottom: 24px; }
  header .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  header .brand span { color: #c2410c; }
  header .meta { text-align: right; font-size: 11px; color: #555; line-height: 1.6; }
  h2 { font-size: 17px; font-weight: 700; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
  .section { margin-bottom: 22px; }
  .row { display: flex; gap: 12px; margin-bottom: 6px; }
  .label { font-weight: 700; min-width: 150px; flex-shrink: 0; color: #444; }
  .value { color: #1a1a1a; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid; }
  .badge-pending { background: #fef3c7; color: #92400e; border-color: #fbbf24; }
  .badge-assigned { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
  .badge-completed { background: #dcfce7; color: #166534; border-color: #86efac; }
  .badge-cancelled { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
  .notes-box { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 10px 14px; font-size: 12px; line-height: 1.6; white-space: pre-wrap; }
  .notes-label { font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
  .sig-box { border-top: 1px solid #999; padding-top: 6px; font-size: 11px; color: #666; }
  footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
  @media print { body { padding: 20px 28px; } }
</style>
</head>
<body>
<header>
  <div class="brand"><span>Regional</span> Carpool</div>
  <div class="meta">
    <strong>MEDICAL TRANSPORT TRIP SHEET</strong><br/>
    Request #${r.id}<br/>
    Printed: ${printedAt}
  </div>
</header>

<div class="section">
  <h2>Patient</h2>
  <div class="row"><span class="label">Name</span><span class="value">${r.patientName}</span></div>
  <div class="row"><span class="label">Status</span><span class="value"><span class="badge badge-${r.status}">${statusLabel}</span></span></div>
</div>

<div class="section">
  <h2>Trip Details</h2>
  <div class="row"><span class="label">Date</span><span class="value">${r.tripDate}</span></div>
  <div class="row"><span class="label">Pickup time</span><span class="value">${r.tripTime}</span></div>
  <div class="row"><span class="label">Pickup address</span><span class="value">${r.pickupAddress}, ${r.pickupSuburb}</span></div>
  <div class="row"><span class="label">Destination</span><span class="value">${r.destinationName}</span></div>
  <div class="row"><span class="label">Destination address</span><span class="value">${r.destinationAddress}</span></div>
  ${r.returnTrip ? `<div class="row"><span class="label">Return trip</span><span class="value">Yes${r.returnTime ? ` — depart ${r.returnTime}` : ""}</span></div>` : ""}
</div>

<div class="section">
  <h2>Assigned Driver</h2>
  ${r.assignedDriverName
    ? `<div class="row"><span class="label">Driver name</span><span class="value">${r.assignedDriverName}</span></div>`
    : `<div class="row"><span class="value" style="color:#888;font-style:italic;">No driver assigned yet</span></div>`}
</div>

${r.coordinatorNotes ? `
<div class="section">
  <h2>Coordinator Notes</h2>
  <div class="notes-label">Internal — do not share with patient</div>
  <div class="notes-box">${r.coordinatorNotes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
</div>` : ""}

${r.notes ? `
<div class="section">
  <h2>Patient Notes</h2>
  <div class="notes-box">${r.notes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
</div>` : ""}

<div class="sig-grid">
  <div class="sig-box">Driver signature &amp; date</div>
  <div class="sig-box">Coordinator signature &amp; date</div>
</div>

<footer>
  <span>Regional Carpool — Medical Transport Program</span>
  <span>Trip Sheet printed ${printedAt}</span>
</footer>

<script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// ── Transport assignment panel ────────────────────────────────────────────────

function TransportRow({ request, approvedDrivers }: { request: MedicalTransportRequest; approvedDrivers: MedicalDriver[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const assign = useAssignMedicalDriver();
  const saveNotes = useUpdateCoordinatorNotes();
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [draftNotes, setDraftNotes] = useState(request.coordinatorNotes ?? "");

  function doSaveNotes() {
    saveNotes.mutate(
      { id: request.id, data: { coordinatorNotes: draftNotes.trim() || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMedicalTransportRequestsQueryKey() });
          toast({ title: "Notes saved", description: "Coordinator notes updated." });
          setNotesOpen(false);
        },
        onError: () => toast({ title: "Save failed", description: "Please try again.", variant: "destructive" }),
      }
    );
  }

  function doAssign() {
    if (!selectedDriverId) return;
    assign.mutate({ id: request.id, data: { driverId: Number(selectedDriverId) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMedicalTransportRequestsQueryKey() });
        const driver = approvedDrivers.find((d) => d.id === Number(selectedDriverId));
        toast({ title: "Driver assigned", description: `${driver?.fullName} has been assigned to this trip.` });
        setAssignOpen(false);
        setSelectedDriverId("");
      },
      onError: () => toast({ title: "Assignment failed", description: "Please try again.", variant: "destructive" }),
    });
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-5" data-testid={`card-transport-${request.id}`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{request.patientName}</span>
              {transportStatusBadge(request.status)}
              {request.returnTrip && <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-xs">Return trip</Badge>}
              <span className="text-xs text-muted-foreground font-mono">Request #{request.id}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {request.pickupSuburb} → {request.destinationName}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                {request.tripDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                Pickup: {request.tripTime}
                {request.returnTrip && request.returnTime && ` / Return: ${request.returnTime}`}
              </span>
              <span><span className="font-medium text-foreground">Pickup address:</span> {request.pickupAddress}</span>
              <span className="sm:col-span-2"><span className="font-medium text-foreground">Destination:</span> {request.destinationAddress}</span>
              {request.assignedDriverName && (
                <span className="sm:col-span-2 flex items-center gap-1.5 text-green-700">
                  <Car className="w-3.5 h-3.5" />
                  Assigned: {request.assignedDriverName}
                </span>
              )}
              {request.notes && <span className="sm:col-span-2"><span className="font-medium text-foreground">Patient notes:</span> {request.notes}</span>}
            </div>

            {/* Coordinator notes inline editor */}
            {notesOpen ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="e.g. Patient needs extra time to board. Wheelchair in boot."
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1 bg-indigo-700 hover:bg-indigo-800 text-white"
                    onClick={doSaveNotes}
                    disabled={saveNotes.isPending}
                  >
                    <Save className="w-3 h-3" />
                    {saveNotes.isPending ? "Saving…" : "Save note"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => { setNotesOpen(false); setDraftNotes(request.coordinatorNotes ?? ""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-2">
                {request.coordinatorNotes ? (
                  <div className="flex-1 rounded-md bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-900">
                    <span className="font-semibold text-indigo-700 flex items-center gap-1 mb-0.5">
                      <NotebookPen className="w-3 h-3" /> Coordinator note
                    </span>
                    {request.coordinatorNotes}
                  </div>
                ) : null}
                <button
                  onClick={() => setNotesOpen(true)}
                  className="text-xs text-muted-foreground hover:text-indigo-700 flex items-center gap-1 mt-0.5 flex-shrink-0"
                >
                  <NotebookPen className="w-3 h-3" />
                  {request.coordinatorNotes ? "Edit note" : "Add note"}
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {request.status === "pending" && (
              <Button
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white gap-1"
                onClick={() => setAssignOpen(true)}
                data-testid={`btn-assign-driver-${request.id}`}
              >
                <Car className="w-4 h-4" /> Assign Driver
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-muted-foreground"
              onClick={() => printTripSheet(request)}
            >
              <Printer className="w-4 h-4" /> Print sheet
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium text-foreground">{request.patientName}</p>
              <p className="text-muted-foreground">{request.pickupSuburb} → {request.destinationName}</p>
              <p className="text-muted-foreground">{request.tripDate} at {request.tripTime}</p>
            </div>
            {approvedDrivers.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                No approved drivers available. Approve a driver registration first.
              </div>
            ) : (
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger data-testid="select-driver">
                  <SelectValue placeholder="Select a verified driver" />
                </SelectTrigger>
                <SelectContent>
                  {approvedDrivers.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.fullName} — {d.vehicleType} {d.hasWheelchairAccess ? "(wheelchair)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 hover:bg-teal-800 text-white"
              onClick={doAssign}
              disabled={assign.isPending || !selectedDriverId || approvedDrivers.length === 0}
              data-testid="btn-confirm-assign"
            >
              {assign.isPending ? "Assigning..." : "Assign Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────

export default function Admin() {
  const [patientSearch, setPatientSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");

  const { data: patients, isLoading: patientsLoading } = useListMedicalPatients();
  const { data: drivers, isLoading: driversLoading } = useListMedicalDrivers();
  const { data: requests, isLoading: requestsLoading } = useListMedicalTransportRequests();

  const pendingPatients = patients?.filter((p) => p.verificationStatus === "pending") ?? [];
  const pendingDrivers = drivers?.filter((d) => d.verificationStatus === "pending") ?? [];
  const approvedDrivers = drivers?.filter((d) => d.verificationStatus === "approved") ?? [];
  const pendingRequests = requests?.filter((r) => r.status === "pending") ?? [];
  const allRequests = requests ?? [];

  const patientQ = patientSearch.trim().toLowerCase();
  const driverQ = driverSearch.trim().toLowerCase();
  const filteredPatients = patientQ
    ? (patients ?? []).filter((p) => p.fullName.toLowerCase().includes(patientQ) || p.suburb.toLowerCase().includes(patientQ))
    : (patients ?? []);
  const filteredDrivers = driverQ
    ? (drivers ?? []).filter((d) => d.fullName.toLowerCase().includes(driverQ) || d.vehicleRego.toLowerCase().includes(driverQ))
    : (drivers ?? []);

  return (
    <Layout>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground bg-muted border rounded-full px-3 py-1 mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          Coordinator Access
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Review registrations and assign drivers to medical transport requests.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600" data-testid="stat-pending-patients">{patientsLoading ? "—" : pendingPatients.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Patients pending</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600" data-testid="stat-pending-drivers">{driversLoading ? "—" : pendingDrivers.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Drivers pending</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-teal-700" data-testid="stat-pending-requests">{requestsLoading ? "—" : pendingRequests.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Trips to assign</div>
        </div>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="grid grid-cols-5 h-11 p-1 mb-6 w-full">
          <TabsTrigger value="patients" className="text-sm gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="admin-tab-patients">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Patients</span>
            {pendingPatients.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingPatients.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-sm gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="admin-tab-drivers">
            <Car className="w-4 h-4" />
            <span className="hidden sm:inline">Drivers</span>
            {pendingDrivers.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingDrivers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transport" className="text-sm gap-1.5 data-[state=active]:bg-teal-700 data-[state=active]:text-white" data-testid="admin-tab-transport">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Transport</span>
            {pendingRequests.length > 0 && (
              <span className="ml-1 bg-teal-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-sm gap-1.5 data-[state=active]:bg-slate-700 data-[state=active]:text-white" data-testid="admin-tab-messages">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-sm gap-1.5 data-[state=active]:bg-indigo-700 data-[state=active]:text-white" data-testid="admin-tab-audit">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
        </TabsList>

        {/* Patients tab */}
        <TabsContent value="patients" className="mt-0 outline-none space-y-3">
          {patientsLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : !patients || patients.length === 0 ? (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              <UserCheck className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No patient registrations yet</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name or suburb…"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              {filteredPatients.length === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                  <p className="font-medium">No patients match "{patientSearch}"</p>
                </div>
              ) : (
                <>
                  {!patientQ && pendingPatients.length > 0 && (
                    <p className="text-sm font-medium text-amber-700">{pendingPatients.length} pending review</p>
                  )}
                  {patientQ && (
                    <p className="text-xs text-muted-foreground">{filteredPatients.length} result{filteredPatients.length !== 1 ? "s" : ""}</p>
                  )}
                  {filteredPatients
                    .slice()
                    .sort((a, b) => (a.verificationStatus === "pending" ? -1 : 1) - (b.verificationStatus === "pending" ? -1 : 1))
                    .map((p) => (
                      <PatientRow key={p.id} patient={p} onAction={() => {}} />
                    ))}
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* Drivers tab */}
        <TabsContent value="drivers" className="mt-0 outline-none space-y-3">
          {driversLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : !drivers || drivers.length === 0 ? (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              <Car className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No driver registrations yet</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name or rego…"
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              {filteredDrivers.length === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                  <p className="font-medium">No drivers match "{driverSearch}"</p>
                </div>
              ) : (
                <>
                  {!driverQ && pendingDrivers.length > 0 && (
                    <p className="text-sm font-medium text-amber-700">{pendingDrivers.length} pending review</p>
                  )}
                  {driverQ && (
                    <p className="text-xs text-muted-foreground">{filteredDrivers.length} result{filteredDrivers.length !== 1 ? "s" : ""}</p>
                  )}
                  {filteredDrivers
                    .slice()
                    .sort((a, b) => (a.verificationStatus === "pending" ? -1 : 1) - (b.verificationStatus === "pending" ? -1 : 1))
                    .map((d) => (
                      <DriverRow key={d.id} driver={d} onAction={() => {}} />
                    ))}
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* Transport requests tab */}
        <TabsContent value="transport" className="mt-0 outline-none space-y-3">
          {requestsLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : (
            <>
              <WeeklySummaryPanel requests={allRequests} />
              {allRequests.length === 0 ? (
                <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No transport requests yet</p>
                </div>
              ) : (
                <>
                  {pendingRequests.length > 0 && (
                    <p className="text-sm font-medium text-amber-700 mb-1">{pendingRequests.length} awaiting driver assignment</p>
                  )}
                  {allRequests
                    .slice()
                    .sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1))
                    .map((r) => (
                      <TransportRow key={r.id} request={r} approvedDrivers={approvedDrivers} />
                    ))}
                </>
              )}
            </>
          )}
        </TabsContent>
        {/* Notifications log tab */}
        <TabsContent value="messages" className="mt-0 outline-none">
          <NotificationsPanel />
        </TabsContent>
        {/* Audit log tab */}
        <TabsContent value="audit" className="mt-0 outline-none">
          <AuditLogPanel />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}

// ── Notifications log panel ────────────────────────────────────────────────

function eventLabel(event: string) {
  switch (event) {
    case "patient_approved": return { label: "Patient Approved", color: "bg-green-100 text-green-800 border-green-200" };
    case "patient_rejected": return { label: "Patient Rejected", color: "bg-red-100 text-red-800 border-red-200" };
    case "driver_approved": return { label: "Driver Approved", color: "bg-green-100 text-green-800 border-green-200" };
    case "driver_rejected": return { label: "Driver Rejected", color: "bg-red-100 text-red-800 border-red-200" };
    case "driver_assigned": return { label: "Driver Assigned", color: "bg-teal-100 text-teal-800 border-teal-200" };
    default: return { label: event, color: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

function NotificationCard({ n }: { n: NotificationEntry }) {
  const [open, setOpen] = useState(false);
  const { label, color } = eventLabel(n.event);
  const date = new Date(n.createdAt);
  const dateStr = date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-slate-100 p-2 shrink-0">
          <Bell className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className={`${color} border text-xs`}>{label}</Badge>
            <span className="text-xs text-muted-foreground capitalize">{n.recipientType}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{n.recipientName}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{n.recipientPhone}</span>
          </div>
          <p className="font-medium text-sm text-foreground">{n.subject}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{dateStr} at {timeStr}</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
          aria-label="Toggle message"
        >
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      {open && (
        <div className="mt-3 ml-11 rounded-lg bg-muted p-3">
          <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{n.message}</pre>
        </div>
      )}
    </div>
  );
}

function NotificationsPanel() {
  const { data: notifications, isLoading } = useListNotifications();
  const sorted = notifications ? [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No notifications sent yet</p>
        <p className="text-sm mt-1">Notifications appear here when you approve or reject a registration, or assign a driver to a transport request.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{sorted.length} notification{sorted.length !== 1 ? "s" : ""} logged — newest first</p>
      {sorted.map(n => <NotificationCard key={n.id} n={n} />)}
    </div>
  );
}

// ── Audit log panel ────────────────────────────────────────────────────────

function auditActionBadge(action: string) {
  if (action === "approved") return <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">Approved</Badge>;
  if (action === "rejected") return <Badge className="bg-red-100 text-red-800 border-red-200 border text-xs">Rejected</Badge>;
  return <Badge className="bg-slate-100 text-slate-700 border-slate-200 border text-xs">{action}</Badge>;
}

function AuditLogRow({ entry }: { entry: VerificationAuditLogEntry }) {
  const date = new Date(entry.decidedAt);
  const dateStr = date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="mt-0.5 rounded-full bg-indigo-50 p-2 shrink-0 self-start">
        <History className="w-4 h-4 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {auditActionBadge(entry.action)}
          <span className="text-xs text-muted-foreground capitalize bg-muted rounded-full px-2 py-0.5">{entry.entityType}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs font-medium text-foreground">#{entry.entityId}</span>
        </div>
        <p className="font-semibold text-sm text-foreground">{entry.entityName}</p>
        {entry.reason && (
          <p className="text-xs text-muted-foreground mt-1 italic">"{entry.reason}"</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{dateStr} at {timeStr}</p>
      </div>
    </div>
  );
}

function exportAuditLogCSV(rows: VerificationAuditLogEntry[]) {
  const header = ["ID", "Type", "Entity ID", "Name", "Decision", "Reason", "Date & Time"];
  const escape = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    header.join(","),
    ...rows.map(e => [
      e.id,
      e.entityType,
      e.entityId,
      e.entityName,
      e.action,
      e.reason ?? "",
      new Date(e.decidedAt).toLocaleString("en-AU"),
    ].map(escape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `verification-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type DatePreset = "all" | "today" | "week" | "month" | "custom";

function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const today = toISO(now);
  if (preset === "today") return { from: today, to: today };
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { from: toISO(start), to: today };
  }
  if (preset === "month") {
    return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: today };
  }
  return { from: "", to: "" };
}

function AuditLogPanel() {
  const [filterType, setFilterType] = useState<"all" | "patient" | "driver">("all");
  const [filterAction, setFilterAction] = useState<"all" | "approved" | "rejected">("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const { data: entries, isLoading } = useListVerificationAuditLog();

  const { from: rangeFrom, to: rangeTo } = datePreset === "custom"
    ? { from: customFrom, to: customTo }
    : getPresetRange(datePreset);

  function applyPreset(preset: DatePreset) {
    setDatePreset(preset);
    if (preset !== "custom") { setCustomFrom(""); setCustomTo(""); }
  }

  const filtered = (entries ?? []).filter(e => {
    if (filterType !== "all" && e.entityType !== filterType) return false;
    if (filterAction !== "all" && e.action !== filterAction) return false;
    if (rangeFrom) {
      const entryDate = e.decidedAt.slice(0, 10);
      if (entryDate < rangeFrom) return false;
    }
    if (rangeTo) {
      const entryDate = e.decidedAt.slice(0, 10);
      if (entryDate > rangeTo) return false;
    }
    return true;
  });

  const hasActiveFilters = filterType !== "all" || filterAction !== "all" || datePreset !== "all";

  function clearAll() {
    setFilterType("all");
    setFilterAction("all");
    setDatePreset("all");
    setCustomFrom("");
    setCustomTo("");
  }

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;
  }

  const presetLabels: { value: DatePreset; label: string }[] = [
    { value: "all", label: "All time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "custom", label: "Custom…" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Type</span>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
              <SelectTrigger className="h-8 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="patient">Patients</SelectItem>
                <SelectItem value="driver">Drivers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Decision</span>
            <Select value={filterAction} onValueChange={(v) => setFilterAction(v as typeof filterAction)}>
              <SelectTrigger className="h-8 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearAll}>
                <X className="w-3 h-3" /> Clear filters
              </Button>
            )}
            <span className="text-xs text-muted-foreground">{filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}</span>
            {filtered.length > 0 && (
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => exportAuditLogCSV(filtered)}>
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Date presets */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-medium text-muted-foreground mr-1">Period</span>
          {presetLabels.map(p => (
            <button
              key={p.value}
              onClick={() => applyPreset(p.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                datePreset === p.value
                  ? "bg-indigo-700 text-white border-indigo-700"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {datePreset === "custom" && (
          <div className="flex flex-wrap gap-2 items-center pt-0.5">
            <span className="text-xs text-muted-foreground">From</span>
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={e => setCustomFrom(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={e => setCustomTo(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {(customFrom || customTo) && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                onClick={() => { setCustomFrom(""); setCustomTo(""); }}
              >
                <X className="w-3 h-3" /> Clear dates
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          <History className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No decisions recorded yet</p>
          <p className="text-sm mt-1">Every time you approve or reject a patient or driver, it will appear here with a timestamp.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => <AuditLogRow key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  );
}
