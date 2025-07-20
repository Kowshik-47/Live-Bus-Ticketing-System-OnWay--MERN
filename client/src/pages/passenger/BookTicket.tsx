import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Bus, MapPin, Clock, Users, CreditCard } from "lucide-react";

export default function BookTicket() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const busCode = searchParams.get("bus");
  const [boardingPoints, setBoardingPoints] = useState([])
  const [destinationPoints, setDestinationPoints] = useState([])
  const [tripDetails, setTripDetails] = useState({
    route: {
      routeNo: '',
      _id: '',
      from: '',
      to: '',
      distance: 0,
      stops: [{
        stop: '',
        distance: ''
      }],
      expirationTime: 0
    },
    bus: {
      _id: '',
      at: '',
      vehicleNo: '',
      division: ''
    },
  })

  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (!token || !userData) {
    navigate('/')
    return
  }

  const user = JSON.parse(userData)
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    passengerName: "",
    passengerPhone: "",
    boardingStop: "",
    destinationStop: "",
  });

  useEffect(() => {
    if (!busCode) {
      setError("Invalid trip code");
      setLoading(false);
      return;
    }
  }, [busCode]);

  useEffect(() => {
    (async () => {
      await getTripDetails()
    })
      ()
  }, [])

  async function getTripDetails() {
    try {
      const response = await fetch(`/api/route/${busCode}`);
      if (!response.ok) {
        throw new Error("Trip not found");
      }
      const data = await response.json();
      setTripDetails(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load trip details",
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (!tripDetails || !tripDetails.route.stops || !tripDetails.bus?.at) return;

    const currentIndex = tripDetails.route.stops.findIndex(
      (stop) => stop.stop === tripDetails.bus.at
    );

    if (currentIndex === -1) {
      console.warn("Current stop not found in stop list");
      return;
    }

    const boarding = tripDetails.route.stops.slice(0, currentIndex + 1);
    const destination = tripDetails.route.stops.slice(currentIndex + 1);

    setBoardingPoints(boarding);
    setDestinationPoints(destination);
  }, [tripDetails]);


  const calculateFare = () => {
    if (!tripDetails || !formData.boardingStop || !formData.destinationStop) {
      return 0;
    }

    let boardingPoint = -1
    for (var i = 0; i < tripDetails.route.stops.length; i++) {
      if (tripDetails.route.stops[i].stop == formData.boardingStop)
        boardingPoint = parseInt(tripDetails.route.stops[i].distance)
    }

    let destinationPoint = -1
    for (var i = 0; i < tripDetails.route.stops.length; i++) {
      if (tripDetails.route.stops[i].stop == formData.destinationStop)
        destinationPoint = parseInt(tripDetails.route.stops[i].distance)
    }

    if (
      boardingPoint === -1 ||
      destinationPoint === -1 ||
      boardingPoint === destinationPoint
    ) {
      return 0;
    }

    return Math.round(Math.abs(boardingPoint - destinationPoint) * 1.2);
  };

  const handleBookTicket = async () => {
    if (!tripDetails) return;

    setBooking(true);
    setError(null);

    try {
      const bookingData = {
        passengerId: user._id,
        busId: busCode,
        routeNo: tripDetails.route.routeNo,
        expirationDuration: tripDetails.route.expirationTime,
        ...formData,
        fare: calculateFare()
      };

      const response = await fetch("/api/tickets/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Booking failed");
      }

      const result = await response.json();
      navigate(`/ticket/${result.ticket.ticketId}`, {
        state: { ticket: result.ticket, qrCode: result.qrCode },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.passengerName &&
      formData.passengerPhone &&
      formData.boardingStop &&
      formData.destinationStop &&
      formData.boardingStop !== formData.destinationStop
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !tripDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <h3 className="font-semibold text-lg mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">
              {error || "Trip not found"}
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fare = calculateFare();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2 rounded-xl">
              <Bus className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Book Your Ticket
              </h1>
              <p className="text-sm text-muted-foreground">
                { }
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bus className="h-5 w-5 text-primary" />
                  <span>Trip Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {tripDetails.route.from + '-' + tripDetails.route.to}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        to {tripDetails.route.from}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {tripDetails.bus?.division || ''} • {tripDetails.bus?.vehicleNo || ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Stops:</p>
                  <div className="space-y-1">
                    {tripDetails.route.stops.map((stop, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary/30 rounded-full" />
                        <span className="text-sm">{stop.stop}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Passenger Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.passengerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passengerName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1234567890"
                      value={formData.passengerPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passengerPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="boarding">Boarding Stop</Label>
                    <Select
                      value={formData.boardingStop}
                      onValueChange={(value) =>
                        setFormData({ ...formData, boardingStop: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select boarding stop" />
                      </SelectTrigger>
                      <SelectContent>
                        {boardingPoints.map((stop) => (
                          <SelectItem key={stop.stop} value={stop.stop}>
                            {stop.stop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination Stop</Label>
                    <Select
                      value={formData.destinationStop}
                      onValueChange={(value) =>
                        setFormData({ ...formData, destinationStop: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinationPoints
                          .filter((stop) => stop.stop !== formData.boardingStop)
                          .map((stop) => (
                            <SelectItem key={stop.stop} value={stop.stop}>
                              {stop.stop}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {fare > 0 && (
                  <div className="bg-primary/10 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Fare:</span>
                      <span className="text-2xl font-bold text-primary">
                        ₹{fare}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBookTicket}
                  disabled={!isFormValid() || booking}
                  size="lg"
                  className="w-full"
                >
                  {booking ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Book & Pay ₹{fare}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
