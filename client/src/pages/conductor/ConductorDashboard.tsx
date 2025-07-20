import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QrScanner from "qr-scanner";
import {
  Bus,
  Users,
  DollarSign,
  QrCode,
  LogOut,
  CheckCircle,
  AlertCircle,
  Phone,
  MapPin,
  RefreshCw,
  Scan,
  UploadIcon,
} from "lucide-react";

export default function ConductorDashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    tickets: [],
    passengers: 0,
    revenue: 0,
    bus: {
      _id: '',
      routeNo: '',
      vehicleNo: '',
      status: '',
      at: ''
    },
    route: {
      stops: [{
        stop: '',
        distance: ''
      }],
    }
  });

  const [loading, setLoading] = useState(false)
  const [stop, setStop] = useState('')
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [manualTicketId, setManualTicketId] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);

  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (!token || !userData) {
    navigate("/");
    return;
  }

  const parsedUser = JSON.parse(userData);
  if (parsedUser.role !== "conductor") {
    navigate("/");
    return;
  }

  const user = parsedUser

  useEffect(() => {
    (async () => {
      await fetchDashboardData();
    })()
  }, []);

  useEffect(() => {
    if (showScanner && videoRef.current) {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => { handleQrScan(result.data) },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
        });

      scanner.start().catch((error) => {
        console.error("Camera access denied:", error);
        setValidationMessage("❌ Camera access denied");
      });

      setQrScanner(scanner);
    } else if (qrScanner) {
      qrScanner.stop();
      setQrScanner(null);
    }

    return () => {
      if (qrScanner) {
        qrScanner.stop();
      }
    };
  }, [showScanner]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/protected/conductor/dashboard/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        throw new Error("No active trip assigned to you");
      }

      if (!response.ok) {
        const responseText = await response.text();
        console.log("Error response: ", responseText);

        if (responseText.includes("<!doctype") || responseText.includes("<html")) {
          throw new Error("Authentication failed - please login again");
        }

        try {
          const errorData = JSON.parse(responseText);
          throw new Error(
            errorData.message ||
            `HTTP ${response.status}: Failed to fetch dashboard data`,
          );
        } catch {
          throw new Error(`HTTP ${response.status}: Server error`);
        }
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const validateTicket = async (ticketId: string) => {
    setValidating(true);
    setValidationMessage(null);

    try {
      const response = await fetch(
        `/api/protected/tickets/${ticketId}/validate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Validation failed");
      }

      setValidationMessage("✅ Ticket validated successfully!");

      await fetchDashboardData();

      setShowScanner(false);
      setManualTicketId("");
    } catch (err) {
      setValidationMessage(
        `❌ ${err instanceof Error ? err.message : "Validation failed"}`,
      );
    } finally {
      setValidating(false);
    }
  }

  async function updateStop() {
    const json = {
      at: stop
    }

    const response = await fetch(
      `/api/protected/conductor/bus/${dashboardData.bus._id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(json)
      },
    )

    const result = await response.json()
    if (!response.ok) {
      setError(result.message || 'Something Went wrong')
    }

    
  }

  const handleQrScan = (result: any) => {
    console.log("QR Scan result:", result);
    try {
      const qrData = JSON.parse(result);
      if (qrData.ticketId) {
        console.log("Found ticket ID in QR:", qrData.ticketId);
        validateTicket(qrData.ticketId);
        return;
      }
    } catch {
      console.log("Treating QR as direct ticket ID:", result.data);
    }

    validateTicket(result.data);
  };

  const startQrScanner = () => {
    setShowScanner(true);
    setValidationMessage(null);
  };

  const stopQrScanner = () => {
    setShowScanner(false);
    if (qrScanner) {
      qrScanner.stop();
      setQrScanner(null);
    }
  };

  const handleManualValidation = () => {
    if (manualTicketId.trim()) {
      validateTicket(manualTicketId.trim());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  function getNextStop(currentStop) {
    for (let i = 0; i < dashboardData.route.stops.length - 1; i++) {
      if (dashboardData.route.stops[i].stop == currentStop) {
        return dashboardData.route.stops[i + 1].stop
      }

      return dashboardData.route.stops[i].stop
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "booked":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchDashboardData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-xl">
                <Bus className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Conductor Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {user.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={fetchDashboardData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {validationMessage && (
          <Alert
            className={`mb-6 ${validationMessage.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            <AlertDescription>{validationMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Passengers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.passengers || 0}
              </div>
              {!dashboardData && (
                <p className="text-xs text-red-500 mt-1">Loading...</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Trip Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{dashboardData?.revenue || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                from {dashboardData?.tickets?.length || 0} bookings
              </p>
              {!dashboardData && (
                <p className="text-xs text-red-500 mt-1">Loading...</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Tickets
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.tickets?.filter((t) => t.status === "verified")
                  .length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.tickets?.filter((t) => t.status === "booked")
                  .length || 0}{" "}
                pending verification
              </p>
              {!dashboardData && (
                <p className="text-xs text-red-500 mt-1">Loading...</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bus className="h-5 w-5 text-primary" />
              <span>Current Trip</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="grid md:grid-cols-2 gap-2">
                      <h3 className="font-semibold mb-2">Bus Information</h3>
                      <p className="text-lg font-medium">
                        Bus No: {dashboardData.bus.vehicleNo}
                      </p>
                      <h3 className="font-semibold mb-2">Route Information</h3>
                      <p className="text-lg font-medium">
                        Route No: {dashboardData.bus.routeNo}
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      Status: {dashboardData.bus.status}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <Badge
                        variant={
                          dashboardData.bus.status === "active"
                            ? "default"
                            : "secondary"
                        }
                        className="mb-2"
                      >
                        {dashboardData.bus.status.toUpperCase()}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Fare: ₹ 1.2/km
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="flex gap-2">
                    <p className="font-bold">At: </p>
                    <h6>{dashboardData.bus.at}</h6>
                  </div>
                  <div className="flex gap-2">
                    <p className="font-bold">Next Stop:</p>
                    <h6>{getNextStop(dashboardData.bus.at)}</h6>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <p className="font-bold">Boarding Point:</p>
                  <Select value={stop} onValueChange={(value) => setStop(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={dashboardData.bus.at} />
                    </SelectTrigger>
                    <SelectContent>
                      {dashboardData.route.stops.map((stop) => (
                        <SelectItem key={stop.stop} value={stop.stop || ' '}>
                          {stop.stop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={updateStop}>
                    <UploadIcon />
                    Update
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">
                  {error ? "Failed to load trip data" : "No Active Trip"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {error
                    ? error
                    : "You don't have an active trip assigned currently."}
                </p>
                <Button onClick={fetchDashboardData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-start space-x-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Ticket Management</span>
              </CardTitle>
              <div className="grig md:grid-cols-2">
                {!showScanner &&
                  <Button onClick={startQrScanner} className="m-2">
                    <Scan />Scan QR Code
                  </Button>
                }
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="m-2">
                      Manual Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Manual Ticket Validation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ticket-id">Ticket ID</Label>
                        <Input
                          id="ticket-id"
                          placeholder="Enter ticket ID"
                          value={manualTicketId}
                          onChange={(e) => setManualTicketId(e.target.value)}
                        />
                      </div>
                      {validating && (
                        <div className="text-center">
                          <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Validating ticket...</p>
                        </div>
                      )}
                      <Button
                        onClick={handleManualValidation}
                        disabled={!manualTicketId.trim() || validating}
                        className="w-full"
                      >
                        Validate Ticket
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div >
            {showScanner &&
              <Card className="border-2 border-primary/20 shadow-lg flex-col content-center items-center">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <QrCode className="h-6 w-6 text-primary" />
                    <span>Scan QR Code</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 flex flex-col items-center">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}
                    <div className="rounded-xl overflow-hidden border-2 border-primary/20 bg-black w-80">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      Point your camera at the QR code - it will scan
                      automatically
                    </div>
                    <Button
                      onClick={() => {
                        stopQrScanner()
                      }}
                    >
                      Close Camera
                    </Button>
                  </div>
                </CardContent>
              </Card>
            }
          </CardHeader >
          <CardContent>
            <Tabs defaultValue="passengers" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="passengers">Passenger List</TabsTrigger>
                <TabsTrigger value="pending">Pending Validation</TabsTrigger>
              </TabsList>

              <TabsContent value="passengers" className="space-y-4">
                {dashboardData?.tickets && dashboardData.tickets.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.tickets.map((ticket) => (
                      <div
                        key={ticket.ticketId}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-medium">
                                {ticket.passengerName}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {ticket.passengerPhone}
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {ticket.boardingStop} →{" "}
                                  {ticket.destinationStop}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="text-right">
                            <p className="font-medium">₹{ticket.fare}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(ticket.bookingTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                          </div>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.toUpperCase()}
                          </Badge>
                          {ticket.status === "booked" && (
                            <Button
                              size="sm"
                              onClick={() => validateTicket(ticket.ticketId)}
                              disabled={validating}
                            >
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Passengers Yet</h3>
                    <p className="text-muted-foreground">
                      Passengers who book tickets for this trip will appear
                      here.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {dashboardData.tickets && dashboardData.tickets.filter((t) => t.status === "booked") &&
                  dashboardData.tickets.filter((t) => t.status === "booked")
                    .length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.tickets
                      .filter((t) => t.status === "booked")
                      .map((ticket) => (
                        <div
                          key={ticket.ticketId}
                          className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <AlertCircle className="h-5 w-5 text-yellow-600" />
                              <div>
                                <p className="font-medium">
                                  {ticket.passengerName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.boardingStop} →{" "}
                                  {ticket.destinationStop} • ₹{ticket.fare}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => validateTicket(ticket.ticketId)}
                            disabled={validating}
                          >
                            {validating ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              "Validate"
                            )}
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">All Tickets Verified</h3>
                    <p className="text-muted-foreground">
                      No pending ticket validations.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card >
      </main >
    </div >
  );
}
