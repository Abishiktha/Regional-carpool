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
  useListNotifications,
  getListMedicalPatientsQueryKey,
  getListMedicalDriversQueryKey,
  getListMedicalTransportRequestsQueryKey,
} from "@workspace/api-client-react";
import type { MedicalPatient, MedicalDriver, MedicalTransportRequest, NotificationEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, UserCheck, Car, ClipboardList, CheckCircle2, XCircle, MapPin, CalendarDays, Clock, AlertCircle, Bell, ChevronDown, ChevronRight } from "lucide-react";

function verificationBadge(status: string) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-800 border-red-200 border text-xs">Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200 border text-xs">Pending</Badge>;
}

function transportStatusBadge(status: string) {
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

// ── Transport assignment panel ────────────────────────────────────────────────

function TransportRow({ request, approvedDrivers }: { request: MedicalTransportRequest; approvedDrivers: MedicalDriver[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const assign = useAssignMedicalDriver();
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [assignOpen, setAssignOpen] = useState(false);

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
              {request.notes && <span className="sm:col-span-2"><span className="font-medium text-foreground">Notes:</span> {request.notes}</span>}
            </div>
          </div>
          {request.status === "pending" && (
            <Button
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white flex-shrink-0 gap-1"
              onClick={() => setAssignOpen(true)}
              data-testid={`btn-assign-driver-${request.id}`}
            >
              <Car className="w-4 h-4" /> Assign Driver
            </Button>
          )}
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
  const { data: patients, isLoading: patientsLoading } = useListMedicalPatients();
  const { data: drivers, isLoading: driversLoading } = useListMedicalDrivers();
  const { data: requests, isLoading: requestsLoading } = useListMedicalTransportRequests();

  const pendingPatients = patients?.filter((p) => p.verificationStatus === "pending") ?? [];
  const pendingDrivers = drivers?.filter((d) => d.verificationStatus === "pending") ?? [];
  const approvedDrivers = drivers?.filter((d) => d.verificationStatus === "approved") ?? [];
  const pendingRequests = requests?.filter((r) => r.status === "pending") ?? [];
  const allRequests = requests ?? [];

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
        <TabsList className="grid grid-cols-4 h-11 p-1 mb-6 w-full sm:w-auto">
          <TabsTrigger value="patients" className="text-sm gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="admin-tab-patients">
            <UserCheck className="w-4 h-4" />
            Patients
            {pendingPatients.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingPatients.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-sm gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="admin-tab-drivers">
            <Car className="w-4 h-4" />
            Drivers
            {pendingDrivers.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingDrivers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transport" className="text-sm gap-1.5 data-[state=active]:bg-teal-700 data-[state=active]:text-white" data-testid="admin-tab-transport">
            <ClipboardList className="w-4 h-4" />
            Transport
            {pendingRequests.length > 0 && (
              <span className="ml-1 bg-teal-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-sm gap-1.5 data-[state=active]:bg-slate-700 data-[state=active]:text-white" data-testid="admin-tab-messages">
            <Bell className="w-4 h-4" />
            Messages
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
              {pendingPatients.length > 0 && (
                <p className="text-sm font-medium text-amber-700 mb-1">{pendingPatients.length} pending review</p>
              )}
              {patients
                .slice()
                .sort((a, b) => (a.verificationStatus === "pending" ? -1 : 1) - (b.verificationStatus === "pending" ? -1 : 1))
                .map((p) => (
                  <PatientRow key={p.id} patient={p} onAction={() => {}} />
                ))}
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
              {pendingDrivers.length > 0 && (
                <p className="text-sm font-medium text-amber-700 mb-1">{pendingDrivers.length} pending review</p>
              )}
              {drivers
                .slice()
                .sort((a, b) => (a.verificationStatus === "pending" ? -1 : 1) - (b.verificationStatus === "pending" ? -1 : 1))
                .map((d) => (
                  <DriverRow key={d.id} driver={d} onAction={() => {}} />
                ))}
            </>
          )}
        </TabsContent>

        {/* Transport requests tab */}
        <TabsContent value="transport" className="mt-0 outline-none space-y-3">
          {requestsLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : allRequests.length === 0 ? (
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
        </TabsContent>
        {/* Notifications log tab */}
        <TabsContent value="messages" className="mt-0 outline-none">
          <NotificationsPanel />
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
