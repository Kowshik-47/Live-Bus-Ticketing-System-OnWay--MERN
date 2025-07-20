import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  Users,
  DollarSign,
  LogOut,
  Shield,
  MapPin,
  Calendar,
  TrendingUp,
  QrCode,
  Download,
  Copy, Plus,
  Loader
} from "lucide-react";
import api from '../../interceptors/api.js'

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedQR, setSelectedQR] = useState<{
    tripId: string;
    qrDataUrl: string;
    bookingUrl: string;
  } | null>(null);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [analyticsData, setAnalyticsData] = useState({
    totalTrips: 0,
    totalRevenue: 0,
    totalPassengers: 0,
    activeTrips: 0,
  })
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  useEffect(() => {

    if (!token || !userData) {
      navigate('/')
    }

    const user = JSON.parse(userData)
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }

    setUser(userData);
  }, [navigate]);

  useEffect(() => {
    (async () => {
      setBuses(await getAllBuses())
      setAnalyticsData(await getAnalyticsData())
      setRoutes(await getAllRoutes())
    })
      ()
  }, [])

  async function getAnalyticsData() {
    try {
      setLoading(true)
      const division = user?.division || ''
      const response = await api.get('/protected/admin/analytics', division)

      if (response.error) {
        const responseText = await response.text();
        console.log("Error response: ", responseText);
      }

      return response.data
    } catch {

    }
  }

  async function getAllBuses() {
    const division = user?.division || ''
    const response = await api.get('/protected/admin/buses', division)

    if (response.message) {
      return null
    }

    return response.data?.buses
  }

  async function getAllRoutes() {
    const division = user?.division || ''
    const response = await api.get('/protected/admin/routes', division)

    if (response.data) {
      return response.data
    }
    return null
  }

  const generateBusQRCode = async (vehicleNo: string, busName: string) => {
    try {
      setGeneratingQR(vehicleNo);
      setQrMessage(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token");
        navigate('/')
      }

      const response = await fetch(`/api/protected/admin/buses/${vehicleNo}/qr`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate QR code");
      }

      const data = await response.json();
      setSelectedQR({
        tripId: `Bus ${busName}`,
        qrDataUrl: data.qrDataUrl,
        bookingUrl: data.bookingUrl,
      });
      setQrMessage(`✅ Bus QR code generated for ${busName}`);
    } catch (error) {
      console.error("QR generation error:", error);
      setQrMessage(
        `❌ ${error instanceof Error ? error.message : "Failed to generate QR code"}`,
      );
    } finally {
      setGeneratingQR(null);
    }
  };

  const copyBookingURL = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setQrMessage("✅ Booking URL copied to clipboard!");
    } catch (error) {
      setQrMessage("❌ Failed to copy URL");
    }
  };

  function addNewBus() {
    navigate('/admin/addbus')
  }

  const downloadQRCode = () => {
    if (selectedQR) {
      const link = document.createElement("a");
      link.download = `${selectedQR.tripId}-qr-code.png`;
      link.href = selectedQR.qrDataUrl;
      link.click();
      setQrMessage("✅ QR code downloaded!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleBusClick = (busId: string) => {
    navigate(`/admin/bus/${busId}`);
  }

  function goToRoute(routeId) {
    navigate(`/admin/route/${routeId}`)
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-xl">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {user.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-IN").format(analyticsData.totalTrips || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Passengers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-IN").format(analyticsData.totalPassengers || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{new Intl.NumberFormat("en-IN").format(analyticsData.totalRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Trips
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-IN").format(analyticsData.activeTrips || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="buses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buses">Buses & Trips</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="buses">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Bus className="h-5 w-5 text-primary" />
                    <span className="text-md">Bus Fleet & Trip Management</span>
                  </CardTitle>
                  <Button onClick={addNewBus}><Plus /> Add New Bus</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {qrMessage && (
                  <Alert
                    className={`${qrMessage.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                  >
                    <AlertDescription>{qrMessage}</AlertDescription>
                  </Alert>
                )}
                {buses.length > 0 ? (buses.map((bus) => (
                  <Card
                    key={bus.vehicleNo}
                    className="border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => handleBusClick(bus._id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bus className="h-6 w-6 text-primary" />
                          <div>
                            <CardTitle className="text-lg">
                              {bus.vehicleNo}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {bus.model} • {bus.capacity} seats
                            </p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 space-x-2">
                          <Badge className="flex justify-center"
                            variant={
                              bus.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {bus.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBusClick(bus.vehicleNo);
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Manage Trips
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateBusQRCode(bus._id, bus.vehicleNo);
                            }}
                            disabled={generatingQR === bus.vehicleNo}
                          >
                            {generatingQR === bus.vehicleNo ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-1" />
                            ) : (
                              <QrCode className="h-4 w-4 mr-1" />
                            )}
                            QR Code
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Click to view detailed management →
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))) : (
                  <div className="flex content-center items-center m-2 p-2">
                    <Loader />Loading ...
                  </div>
                )}

                {/* QR Code Display Section */}
                {selectedQR && (
                  <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        <span>Bus QR Code</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="text-center">
                          <img
                            src={selectedQR.qrDataUrl}
                            alt="Bus QR Code"
                            className="mx-auto w-48 h-48 border rounded"
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="font-medium text-green-900">
                              {selectedQR.tripId}
                            </p>
                            <p className="text-sm text-green-700">
                              Permanent QR code for this bus
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground break-all">
                              {selectedQR.bookingUrl}
                            </p>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  copyBookingURL(selectedQR.bookingUrl)
                                }
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy URL
                              </Button>
                              <Button size="sm" onClick={downloadQRCode}>
                                <Download className="h-3 w-3 mr-1" />
                                Download QR
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>Route Management</span>
                  </CardTitle>
                  <Button onClick={() => { navigate('/admin/addroute') }}>Create New Route</Button>
                </div>
              </CardHeader>
              <CardContent>
                {routes.length > 0 ? (routes.map((route) => (
                  <Card
                    key={route.routeNo}
                    className="border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => goToRoute(route._id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bus className="h-6 w-6 text-primary" />
                          <div>
                            <CardTitle className="text-lg">
                              {route.routeNo}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {route.from} • {route.to}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Click to view detailed management →
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))) : (
                  <div className="flex content-center items-center m-2 p-2">
                    <Loader />Loading ...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Analytics & Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Business Intelligence</h3>
                  <p className="text-muted-foreground mb-4">
                    Monitor performance and generate detailed reports.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">• Revenue and profit analysis</p>
                    <p className="text-sm">• Passenger trends and patterns</p>
                    <p className="text-sm">• Route performance metrics</p>
                    <p className="text-sm">• Conductor performance tracking</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div >
  );
}
