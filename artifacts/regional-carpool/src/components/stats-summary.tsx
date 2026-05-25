import { useGetStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Users, CalendarCheck, MapPin } from "lucide-react";

export function StatsSummary() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Active Trips",
      value: stats.activeCarpoolPosts,
      icon: Car,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Available Seats",
      value: stats.seatsAvailable,
      icon: Users,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Open Requests",
      value: stats.activeRideRequests,
      icon: MapPin,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Total Rides Shared",
      value: stats.totalBookings + stats.totalAcceptances,
      icon: CalendarCheck,
      color: "text-foreground",
      bg: "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, i) => (
        <Card key={i} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col items-start gap-3">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
