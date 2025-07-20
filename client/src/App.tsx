import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BookTicket from "./pages/passenger/BookTicket";
import Login from "./pages/auth/Login";
import TicketConfirmation from "./pages/passenger/TicketConfirmation";
import ConductorDashboard from "./pages/conductor/ConductorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import BusDetailPage from "./pages/admin/BusDetailPage";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/auth/SignUp";
import Passenger from "./pages/passenger/Passenger";
import AddBusPage from './pages/admin/AddBusPage'
import AddRoutePage from "./pages/admin/AddRoutePage";
import RouteDetailsPage from './pages/admin/RouteDetailsPage'

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/book" element={<BookTicket />} />
          <Route path="/" element={<Login />} />
          <Route path="/auth/register" element={<SignUp />} />
          <Route path="/ticket/:ticketId" element={<TicketConfirmation />} />
          <Route path="/conductor" element={<ConductorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/passenger" element={<Passenger />} />
          <Route path="/admin/bus/:busId" element={<BusDetailPage />} />
          <Route path="/admin/route/:routeId" element={<RouteDetailsPage />} />
          <Route path="/admin/addbus" element={<AddBusPage />} />
          <Route path="/admin/addroute" element={<AddRoutePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
