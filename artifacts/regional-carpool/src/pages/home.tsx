import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { StatsSummary } from "@/components/stats-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarpoolBoard } from "@/components/carpool-board";
import { RideRequestBoard } from "@/components/ride-request-board";
import { Button } from "@/components/ui/button";
import { HeartPulse, ShieldCheck, Car, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-serif tracking-tight">
          Find your way around.
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
          Whether you're driving to the next town or need a lift, connect with locals going the same way.
        </p>
      </div>

      <StatsSummary />

      <Tabs defaultValue="carpool" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 h-12 p-1 mb-6">
          <TabsTrigger
            value="carpool"
            className="text-sm font-medium h-full rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            data-testid="tab-carpool"
          >
            Carpool Board
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="text-sm font-medium h-full rounded-md data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-sm"
            data-testid="tab-requests"
          >
            Ride Requests
          </TabsTrigger>
          <TabsTrigger
            value="medical"
            className="text-sm font-medium h-full rounded-md data-[state=active]:bg-teal-700 data-[state=active]:text-white data-[state=active]:shadow-sm"
            data-testid="tab-medical"
          >
            Medical Transport
          </TabsTrigger>
        </TabsList>

        <TabsContent value="carpool" className="mt-0 outline-none">
          <CarpoolBoard />
        </TabsContent>

        <TabsContent value="requests" className="mt-0 outline-none">
          <RideRequestBoard />
        </TabsContent>

        <TabsContent value="medical" className="mt-0 outline-none">
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
                <HeartPulse className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Medical Transport Package</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Safe, verified transport for elderly residents attending recurring medical appointments. All drivers are police-checked.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <ShieldCheck className="w-5 h-5 text-teal-700 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">Police-checked drivers</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Car className="w-5 h-5 text-teal-700 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">Wheelchair-accessible vehicles</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <UserCheck className="w-5 h-5 text-teal-700 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">Verified patients only</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/medical" className="flex-1">
                <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white" data-testid="btn-go-medical-hub">
                  Open Medical Transport Hub
                </Button>
              </Link>
              <Link href="/medical/register/patient">
                <Button variant="outline" className="w-full sm:w-auto border-teal-300 text-teal-700 hover:bg-teal-50" data-testid="btn-register-patient-home">
                  Register as Patient
                </Button>
              </Link>
              <Link href="/medical/register/driver">
                <Button variant="outline" className="w-full sm:w-auto" data-testid="btn-register-driver-home">
                  Register as Driver
                </Button>
              </Link>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
