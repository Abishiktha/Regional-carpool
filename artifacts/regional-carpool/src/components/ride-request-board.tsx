import { useState } from "react";
import { useListRideRequests, useAcceptRideRequest, getListRideRequestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Calendar, Users, Plus, ChevronRight, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function RideRequestBoard() {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const { data: requests, isLoading } = useListRideRequests({ fromLocation, toLocation });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="From where?"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="To where?"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>
        <Link href="/ride-requests/new" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto gap-2">
            <Plus className="w-4 h-4" />
            Request a Ride
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((request) => (
            <RideRequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-card rounded-xl border border-dashed">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No requests found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Nobody has requested a ride matching your search. Be the first to ask!
          </p>
          <Link href="/ride-requests/new">
            <Button variant="secondary">Request a Ride</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function RideRequestCard({ request }: { request: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const acceptMutation = useAcceptRideRequest();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const isOpen = request.status === "open";
  const commission = request.offeredPrice * 0.1;
  const netEarnings = request.offeredPrice - commission;

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    acceptMutation.mutate(
      {
        id: request.id,
        data: {
          driverName: name,
          driverPhone: phone,
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast({
            title: "Ride accepted!",
            description: "You have successfully accepted this ride request.",
          });
          queryClient.invalidateQueries({ queryKey: getListRideRequestsQueryKey() });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to accept ride. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-secondary/50 transition-colors">
      <CardHeader className="p-5 pb-4 bg-muted/30 border-b border-border/50 flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-lg">{request.fromLocation}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-lg">{request.toLocation}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(parseISO(request.travelDate), "MMM d, yyyy")}
            </span>
          </div>
        </div>
        <Badge variant={isOpen ? "outline" : "secondary"} className={isOpen ? "border-secondary text-secondary" : ""}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent className="p-5 flex-1 space-y-4">
        <div className="flex justify-between items-center bg-card p-3 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center font-bold text-sm">
              {request.passengerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{request.passengerName}</p>
              <p className="text-xs text-muted-foreground mt-1">Passenger</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-accent">${request.offeredPrice}</p>
            <p className="text-xs text-muted-foreground">offered total</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">For {request.passengerCount} {request.passengerCount === 1 ? "passenger" : "passengers"}</span>
        </div>
        
        {request.notes && (
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border border-border/50 italic">
            "{request.notes}"
          </p>
        )}
      </CardContent>
      <CardFooter className="p-5 pt-0 mt-auto">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="w-full" disabled={!isOpen} data-testid={`button-accept-ride-${request.id}`}>
              {isOpen ? "Accept this Ride" : "Already Accepted"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAccept}>
              <DialogHeader>
                <DialogTitle>Accept Ride Request</DialogTitle>
                <DialogDescription>
                  You are accepting a ride request from {request.passengerName}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="driverName">Your Name</Label>
                  <Input id="driverName" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="driverPhone">Phone Number</Label>
                  <Input id="driverPhone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Offered Price:</span>
                    <span>${request.offeredPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Platform Fee (10%):</span>
                    <span>-${commission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span>Your Earnings:</span>
                    <span className="text-primary">${netEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={acceptMutation.isPending} data-testid="button-confirm-acceptance">
                  {acceptMutation.isPending ? "Accepting..." : "Confirm Acceptance"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
