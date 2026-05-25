import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import NewCarpoolPost from "@/pages/new-carpool-post";
import NewRideRequest from "@/pages/new-ride-request";
import MedicalHub from "@/pages/medical-hub";
import MedicalPatientRegister from "@/pages/medical-patient-register";
import MedicalDriverRegister from "@/pages/medical-driver-register";
import NewMedicalTransport from "@/pages/new-medical-transport";
import Admin from "@/pages/admin";
import MyMessages from "@/pages/my-messages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/carpool-posts/new" component={NewCarpoolPost} />
      <Route path="/ride-requests/new" component={NewRideRequest} />
      <Route path="/medical" component={MedicalHub} />
      <Route path="/medical/register/patient" component={MedicalPatientRegister} />
      <Route path="/medical/register/driver" component={MedicalDriverRegister} />
      <Route path="/medical/transport/new" component={NewMedicalTransport} />
      <Route path="/admin" component={Admin} />
      <Route path="/medical/messages" component={MyMessages} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
