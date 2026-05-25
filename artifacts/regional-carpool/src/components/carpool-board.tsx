import { useState } from "react";
import { useListCarpoolPosts, useBookCarpoolPost, getListCarpoolPostsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Calendar, Clock, Users, Plus, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function CarpoolBoard() {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const { data: posts, isLoading } = useListCarpoolPosts({ fromLocation, toLocation });

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
        <Link href="/carpool-posts/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2">
            <Plus className="w-4 h-4" />
            Post a Trip
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <CarpoolPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-card rounded-xl border border-dashed">
          <CarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No trips found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Nobody has posted a trip matching your search. Check back later or request a ride instead.
          </p>
          <Link href="/ride-requests/new">
            <Button variant="outline">Request a Ride</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0m-10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0" />
    </svg>
  );
}

function CarpoolPostCard({ post }: { post: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const bookMutation = useBookCarpoolPost();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState("1");

  const isActive = post.status === "active";
  const isFull = post.status === "full";

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    bookMutation.mutate(
      {
        id: post.id,
        data: {
          passengerName: name,
          passengerPhone: phone,
          seatsBooked: parseInt(seats, 10),
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast({
            title: "Seat booked!",
            description: "You have successfully booked a seat.",
          });
          queryClient.invalidateQueries({ queryKey: getListCarpoolPostsQueryKey() });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to book seat. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="p-5 pb-4 bg-muted/30 border-b border-border/50 flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-lg">{post.fromLocation}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-lg">{post.toLocation}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(parseISO(post.travelDate), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.travelTime}
            </span>
          </div>
        </div>
        <Badge variant={isActive ? "default" : isFull ? "secondary" : "outline"} className={isActive ? "bg-primary text-primary-foreground" : ""}>
          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent className="p-5 flex-1 space-y-4">
        <div className="flex justify-between items-center bg-card p-3 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-sm">
              {post.driverName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{post.driverName}</p>
              <p className="text-xs text-muted-foreground mt-1">Driver</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary">${post.pricePerSeat}</p>
            <p className="text-xs text-muted-foreground">per seat</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{post.availableSeats} of {post.totalSeats} seats available</span>
        </div>
        
        {post.notes && (
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border border-border/50 italic">
            "{post.notes}"
          </p>
        )}
      </CardContent>
      <CardFooter className="p-5 pt-0 mt-auto">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={!isActive} data-testid={`button-book-trip-${post.id}`}>
              {isActive ? "Book a Seat" : "Trip is Full"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleBook}>
              <DialogHeader>
                <DialogTitle>Book a Seat</DialogTitle>
                <DialogDescription>
                  You are booking a ride from {post.fromLocation} to {post.toLocation} for ${post.pricePerSeat} per seat.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seats">Seats to Book</Label>
                  <Input 
                    id="seats" 
                    type="number" 
                    min="1" 
                    max={post.availableSeats} 
                    required 
                    value={seats} 
                    onChange={(e) => setSeats(e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground">
                    Total cost: <span className="font-bold text-primary">${parseInt(seats || "0", 10) * post.pricePerSeat}</span>
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={bookMutation.isPending} data-testid="button-confirm-booking">
                  {bookMutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
