import { Layout } from "@/components/layout";
import { StatsSummary } from "@/components/stats-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarpoolBoard } from "@/components/carpool-board";
import { RideRequestBoard } from "@/components/ride-request-board";

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
        <TabsList className="w-full sm:w-auto grid grid-cols-2 h-12 p-1 mb-6">
          <TabsTrigger value="carpool" className="text-sm font-medium h-full rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            Carpool Board
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-sm font-medium h-full rounded-md data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-sm">
            Ride Requests
          </TabsTrigger>
        </TabsList>
        <TabsContent value="carpool" className="mt-0 outline-none">
          <CarpoolBoard />
        </TabsContent>
        <TabsContent value="requests" className="mt-0 outline-none">
          <RideRequestBoard />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
