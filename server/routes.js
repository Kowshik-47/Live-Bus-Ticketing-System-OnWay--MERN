import express from "express";
import cors from "cors";
import {
  handleLogin,
  handleRegisterPassenger,
  verifyToken,
  requireRole,
} from "./routes/auth.js";
import {
  handleBookTicket,
  handleValidateTicket,
  handleGetConductorDashboard,
  handleGetTicket,
  handleUpdateTripStatus,
} from "./routes/tickets.js";
import {
  handleGetAnalytics,
  handleGetAllBuses,
  handleGetAllRoutes,
  handleCreateBus,
  handleCreateRoute,
  handleGenerateBusQR,
  getRoute,
  updateStop,
  getBusById,
  getRouteById,
  updateRouteById
} from "./routes/admin.js";
import { connectDataBase } from "./database.js";

export function createServer() {
  connectDataBase()
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Bus Ticket System API v1.0" });
  });

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegisterPassenger);

  // Ticket booking (public)
  app.post("/api/tickets/book", handleBookTicket);
  app.get("/api/tickets/:ticketId", handleGetTicket);

  // Protected routes
  app.use("/api/protected", verifyToken);

  // Conductor routes
  app.get(
    "/api/protected/conductor/dashboard/:conductorId",
    requireRole(["conductor", "admin"]),
    handleGetConductorDashboard,
  );

  app.put('/api/protected/conductor/bus/:busId',
    requireRole(['conductor']),
    updateStop
  )
  app.put(
    "/api/protected/conductor/trips/:tripId/status",
    requireRole(["conductor", "admin"]),
    handleUpdateTripStatus,
  );
  app.post(
    "/api/protected/tickets/:ticketId/validate",
    requireRole(["conductor", "admin"]),
    handleValidateTicket,
  );

  //Admin
  app.get(
    "/api/protected/admin/analytics",
    requireRole(["admin"]),
    handleGetAnalytics,
  );
  app.get(
    "/api/protected/admin/buses",
    requireRole(["admin"]),
    handleGetAllBuses,
  );
  app.get(
    '/api/protected/bus/:busId',
    requireRole(['conductor', 'admin']),
    getBusById
  )
  app.get(
    "/api/protected/admin/routes",
    requireRole(["admin"]),
    handleGetAllRoutes,
  );
  app.get(
    "/api/protected/admin/routes/:routeId",
    requireRole(["admin"]),
    getRouteById,
  );
  app.put(
    "/api/protected/admin/routes/:routeId",
    requireRole(["admin"]),
    updateRouteById,
  );
  app.get('/api/route/:busId',
    getRoute
  )
  app.post(
    "/api/protected/admin/addbus",
    requireRole(["admin"]),
    handleCreateBus,
  );
  app.post(
    "/api/protected/admin/routes",
    requireRole(["admin"]),
    handleCreateRoute,
  );
  app.get(
    "/api/protected/admin/buses/:busId/qr",
    requireRole(["admin"]),
    handleGenerateBusQR,
  );

  return app;
}
