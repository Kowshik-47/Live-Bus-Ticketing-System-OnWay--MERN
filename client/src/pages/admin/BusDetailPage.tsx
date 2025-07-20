import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  LogOut,
  Calendar,
  QrCode,
  CheckCircle,
  Download,
  Copy,
  ArrowLeft,
} from "lucide-react";

export default function BusDetailPage() {
  const navigate = useNavigate();
  const { busId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [bus, setBus] = useState<any>(null);
  const [selectedQR, setSelectedQR] = useState<{
    tripId: string;
    qrDataUrl: string;
    bookingUrl: string;
  } | null>(null);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState<boolean>(false);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showEditBus, setShowEditBus] = useState(false);
  const [newTrip, setNewTrip] = useState({
    route: "",
    departure: "",
    arrival: "",
    fare: "",
    date: "",
  });
  const [editBusData, setEditBusData] = useState({
    vehicleNo: "",
    model: "",
    capacity: "",
    status: "",
  });

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        navigate("/n");
        return;
      }

      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "admin") {
        navigate("/");
        return;
      }

      setUser(parsedUser);

      // Find the bus by ID
      const foundBus: any = await getBusById(busId)
      if (foundBus) {
        setBus(foundBus);
        // Initialize edit form with current bus data
        setEditBusData({
          vehicleNo: foundBus.vehicleNo || '',
          model: foundBus.model,
          capacity: foundBus.capacity.toString(),
          status: foundBus.status,
        });
      } else {
        navigate("/admin");
      }
    })()

  }, [navigate, busId]);

  async function getBusById(busId) {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/login?role=admin");
      return;
    }

    const response = await fetch(
      `/api/protected/bus/${busId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const result = await response.json()
      new Error(result.message)
    }

    return await response.json()
  }
  const generateBusQRCode = async (busId: string, busName: string) => {
    try {
      setGeneratingQR(true);
      setQrMessage(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(`/api/protected/admin/buses/${busId}/qr`, {
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
      setGeneratingQR(false);
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

  const handleBackToAdmin = () => {
    navigate("/admin");
  };

  const handleAddTrip = () => {
    setShowAddTrip(true);
  };

  const handleSaveTrip = () => {
    // In a real app, this would make an API call to save the trip
    console.log("Saving trip:", newTrip);
    setQrMessage("✅ Trip added successfully!");

    // Add the new trip to the bus (mock implementation)
    const updatedTrip = {
      id: `trip-${Date.now()}`,
      route: `${newTrip.departure} → ${newTrip.arrival}`,
      time: newTrip.route,
      status: "scheduled",
      passengers: 0,
      date: newTrip.date,
      fare: newTrip.fare,
    };

    setBus((prev: any) => ({
      ...prev,
      trips: [...prev.trips, updatedTrip],
    }));

    setShowAddTrip(false);
    setNewTrip({
      route: "",
      departure: "",
      arrival: "",
      fare: "",
      date: "",
    });
  };

  const handleEditBus = () => {
    setShowEditBus(true);
  };

  const handleSaveBusEdit = async () => {
    await fetch(`/api/protected/bus/${busId}`,
      {

      }
    )
    console.log("Updating bus:", editBusData);
    setQrMessage("✅ Bus information updated successfully!");

    setBus((prev: any) => ({
      ...prev,
      number: editBusData.vehicleNo,
      model: editBusData.model,
      capacity: parseInt(editBusData.capacity),
      status: editBusData.status,
    }));

    setShowEditBus(false);
  };

  const handleCancelBusEdit = () => {
    if (bus) {
      setEditBusData({
        vehicleNo: bus.vehicleNo,
        model: bus.model,
        capacity: bus.capacity.toString(),
        status: bus.status,
      });
    }
    setShowEditBus(false);
  };

  if (!user || !bus) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleBackToAdmin}>
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
              <div className="bg-primary p-2 rounded-xl">
                <Bus className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Bus Management - {bus.vehicleNo}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Detailed bus and trip management
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
        {qrMessage && (
          <Alert
            className={`mb-6 ${qrMessage.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            <AlertDescription>{qrMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Bus Details Header */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary p-3 rounded-xl">
                    <Bus className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{bus.vehicleNo}</CardTitle>
                    <p className="text-muted-foreground">
                      {bus.model} • {bus.capacity} seats capacity
                    </p>
                  </div>
                  <Badge
                    variant={bus.status === "Active" ? "default" : "secondary"}
                    className="text-sm px-3 py-1"
                  >
                    {bus.status}
                  </Badge>
                </div>
                <div className="grid md:grid-cols-3 space-x-2">
                  <Button variant="outline" onClick={handleEditBus}>
                    Edit Bus Info
                  </Button>
                  <Button onClick={handleAddTrip}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Add New Trip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateBusQRCode(bus._id, bus.vehicleNo)}
                    disabled={generatingQR}
                  >
                    {generatingQR ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                    ) : (
                      <QrCode className="h-4 w-4 mr-2" />
                    )}
                    Generate QR Code
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Edit Bus Form */}
          {showEditBus && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">
                  Edit Bus Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Bus Number
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., MH-12-AB-1234"
                      value={editBusData.vehicleNo}
                      onChange={(e) =>
                        setEditBusData((prev) => ({
                          ...prev,
                          vehicleNo: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Bus Model
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Volvo B9R"
                      value={editBusData.model}
                      onChange={(e) =>
                        setEditBusData((prev) => ({
                          ...prev,
                          model: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Seating Capacity
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., 45"
                      value={editBusData.capacity}
                      onChange={(e) =>
                        setEditBusData((prev) => ({
                          ...prev,
                          capacity: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Status
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={editBusData.status}
                      onChange={(e) =>
                        setEditBusData((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Out of Service">Out of Service</option>
                      <option value="Reserved">Reserved</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveBusEdit}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelBusEdit}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Trip Form */}
          {showAddTrip && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-900">
                  Add New Trip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Departure Station
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Mumbai Central"
                      value={newTrip.departure}
                      onChange={(e) =>
                        setNewTrip((prev) => ({
                          ...prev,
                          departure: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Arrival Station
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Pune Station"
                      value={newTrip.arrival}
                      onChange={(e) =>
                        setNewTrip((prev) => ({
                          ...prev,
                          arrival: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Departure Time
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., 14:30"
                      value={newTrip.route}
                      onChange={(e) =>
                        setNewTrip((prev) => ({
                          ...prev,
                          route: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-md"
                      value={newTrip.date}
                      onChange={(e) =>
                        setNewTrip((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Fare (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., 350"
                      value={newTrip.fare}
                      onChange={(e) =>
                        setNewTrip((prev) => ({
                          ...prev,
                          fare: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveTrip}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Trip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddTrip(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                          onClick={() => copyBookingURL(selectedQR.bookingUrl)}
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
        </div>
      </main>
    </div>
  );
}
