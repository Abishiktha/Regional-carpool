import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListMedicalTransportRequests } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, CheckCircle2, UserCheck, Car, ShieldCheck, ClipboardList, ArrowRight, CalendarDays, Bell, RepeatIcon } from "lucide-react";

function statusColor(status: string) {
  if (status === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "assigned") return "bg-green-100 text-green-800 border-green-200";
  if (status === "completed") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export default function MedicalHub() {
  const { data: requests, isLoading } = useListMedicalTransportRequests();

  return (
    <Layout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Medical Transport
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-serif tracking-tight">
          Medical Transport Package
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
          Safe, reliable transport to medical appointments for elderly and mobility-impaired residents across regional Australia. All drivers are police-checked and verified.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-10">
        <div className="rounded-xl border bg-card p-6 flex flex-col gap-4 hover:shadow-md transition-shadow" data-testid="card-patient-register">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">I need transport</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Register as a patient to book transport to recurring medical appointments. Includes GP visits, dialysis, specialist consultations, and more.
            </p>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />Register once, book anytime</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />Verified, trained drivers</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />Wheelchair-accessible vehicles available</li>
          </ul>
          <Link href="/medical/register/patient">
            <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white mt-auto" data-testid="btn-register-patient">
              Register as Patient <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border bg-card p-6 flex flex-col gap-4 hover:shadow-md transition-shadow" data-testid="card-driver-register">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">I can drive patients</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Volunteer or community transport drivers are welcome. Help elderly residents in your region get to critical medical appointments.
            </p>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />Police check required</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />Working with Vulnerable People check</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />Vehicle registration verified</li>
          </ul>
          <Link href="/medical/register/driver">
            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 mt-auto" data-testid="btn-register-driver">
              Register as Driver <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border bg-card p-6 flex flex-col gap-4 hover:shadow-md transition-shadow" data-testid="card-recurring-appointments">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <RepeatIcon className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Recurring appointments</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Register standing weekly or fortnightly trips — dialysis, chemotherapy, specialist visits — and book transport for each one in seconds.
            </p>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />Register once, book every trip</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />Clinic details pre-filled for you</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />Weekly, fortnightly or monthly</li>
          </ul>
          <Link href="/medical/appointments">
            <Button variant="outline" className="w-full border-amber-600 text-amber-700 hover:bg-amber-50 mt-auto" data-testid="btn-recurring-appointments">
              Manage Appointments <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/50 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5 rounded-full bg-slate-100 p-2 shrink-0 border">
            <Bell className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Check your messages</p>
            <p className="text-xs text-muted-foreground mt-0.5">See updates about your registration approval and transport booking — including when a driver has been assigned to your trip.</p>
          </div>
        </div>
        <Link href="/medical/messages">
          <Button size="sm" variant="outline" className="shrink-0 w-full sm:w-auto" data-testid="btn-my-messages">
            <Bell className="w-3.5 h-3.5 mr-1.5" />
            My Messages
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-teal-700" />
          <h2 className="text-xl font-bold text-foreground">Transport Requests</h2>
        </div>
        <Link href="/medical/transport/new">
          <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white" data-testid="btn-book-transport">
            + Book Transport
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : !requests || requests.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-foreground">No transport requests yet</p>
          <p className="text-sm text-muted-foreground mt-1">Register as a patient and book your first trip.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`card-transport-${r.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-foreground">{r.patientName}</span>
                  <Badge className={`text-xs border ${statusColor(r.status)}`}>{r.status}</Badge>
                  {r.returnTrip && <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">Return trip</Badge>}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{r.pickupSuburb} → {r.destinationName}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{r.tripDate}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.tripTime}</span>
                  {r.assignedDriverName && (
                    <span className="flex items-center gap-1 text-green-700"><Car className="w-3 h-3" />{r.assignedDriverName}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
