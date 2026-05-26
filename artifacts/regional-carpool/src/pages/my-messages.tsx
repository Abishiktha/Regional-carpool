import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListNotifications } from "@workspace/api-client-react";
import type { NotificationEntry } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronDown, ChevronRight, Search, MessageSquare } from "lucide-react";

type RecipientType = "patient" | "driver";

function eventLabel(event: string) {
  switch (event) {
    case "patient_approved": return { label: "Registration Approved", color: "bg-green-100 text-green-800 border-green-200" };
    case "patient_rejected": return { label: "Registration Rejected", color: "bg-red-100 text-red-800 border-red-200" };
    case "driver_approved": return { label: "Registration Approved", color: "bg-green-100 text-green-800 border-green-200" };
    case "driver_rejected": return { label: "Registration Rejected", color: "bg-red-100 text-red-800 border-red-200" };
    case "driver_assigned": return { label: "Driver Assigned", color: "bg-teal-100 text-teal-800 border-teal-200" };
    default: return { label: event, color: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

function MessageCard({ n }: { n: NotificationEntry }) {
  const [open, setOpen] = useState(false);
  const { label, color } = eventLabel(n.event);
  const date = new Date(n.createdAt);
  const dateStr = date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-teal-50 p-2 shrink-0 border border-teal-100">
          <MessageSquare className="w-4 h-4 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className={`${color} border text-xs`}>{label}</Badge>
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
        <div className="mt-3 ml-11 rounded-lg bg-muted p-4">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{n.message}</pre>
        </div>
      )}
    </div>
  );
}

export default function MyMessages() {
  const [idInput, setIdInput] = useState("");
  const [typeInput, setTypeInput] = useState<RecipientType>("patient");
  const [searchedId, setSearchedId] = useState<number | null>(null);
  const [searchedType, setSearchedType] = useState<RecipientType>("patient");

  const { data: notifications, isLoading, isFetched } = useListNotifications(
    searchedId !== null ? { recipientType: searchedType, recipientId: searchedId } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: searchedId !== null } as any }
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(idInput.trim(), 10);
    if (!isNaN(id) && id > 0) {
      setSearchedId(id);
      setSearchedType(typeInput);
    }
  }

  const sorted = notifications ? [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  return (
    <Layout>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground bg-muted border rounded-full px-3 py-1 mb-4">
          <Bell className="w-3.5 h-3.5" />
          Message Inbox
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Check My Messages</h1>
        <p className="text-muted-foreground mt-1">
          Enter your Patient or Driver ID to see messages about your registration and transport bookings.
        </p>
      </div>

      <form onSubmit={handleSearch} className="rounded-2xl border bg-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTypeInput("patient")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${typeInput === "patient" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"}`}
            >
              I'm a Patient
            </button>
            <button
              type="button"
              onClick={() => setTypeInput("driver")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${typeInput === "driver" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"}`}
            >
              I'm a Driver
            </button>
          </div>
          <div className="flex flex-1 gap-2">
            <Input
              placeholder={`Enter your ${typeInput === "patient" ? "Patient" : "Driver"} ID number`}
              value={idInput}
              onChange={e => setIdInput(e.target.value)}
              type="number"
              min="1"
              className="flex-1"
            />
            <Button type="submit" className="shrink-0">
              <Search className="w-4 h-4 mr-1.5" />
              Look Up
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Your ID was shown on screen when you completed your registration. It starts with # and looks like a number.
        </p>
      </form>

      {searchedId !== null && (
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-20 rounded-xl border bg-muted animate-pulse" />)}
            </div>
          ) : !isFetched || sorted.length === 0 ? (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No messages found</p>
              <p className="text-sm mt-1">
                No messages for {searchedType} #{searchedId}. Please check your ID and try again.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">
                {sorted.length} message{sorted.length !== 1 ? "s" : ""} for {searchedType === "patient" ? "Patient" : "Driver"} #{searchedId} — {notifications![0]?.recipientName}
              </p>
              {sorted.map(n => <MessageCard key={n.id} n={n} />)}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
