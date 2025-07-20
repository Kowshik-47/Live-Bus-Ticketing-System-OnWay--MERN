import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bus, QrCode, Smartphone, Ticket, Users, LogOut } from "lucide-react";

export default function Passenger() {
  const [showScanner, setShowScanner] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);

  useEffect(() => {
    if (showScanner && videoRef.current) {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          handleManualScan(result.data);
          setShowScanner(false);
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
        },
      );

      scanner.start().catch((error) => {
        console.error("Camera access denied:", error);
        setError(
          "Camera access denied. Please allow camera permission and try again.",
        );
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

  const handleManualScan = (qrText: string) => {
    try {
      const url = new URL(qrText);
      const tripCode = url.searchParams.get("trip");
      console.log(qrText)
      if (tripCode) {
        navigate(`/book?bus=${tripCode}`);
      }
    } catch {
      // If not a URL, treat as direct trip code
      navigate(`/book?trip=${qrText}`);
    }
  };

  const handleManualQR = () => {
    if (qrInput.trim()) {
      handleManualScan(qrInput.trim());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleRoleLogin = (role: string) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-xl">
                <Bus className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">OnWay</h1>
                <p className="text-sm text-muted-foreground">
                  Smart Ticketing System
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


      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Scan QR Code to Book Your Bus Ticket
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simply scan the QR code displayed in your bus to instantly book and
            pay for your journey. Fast, secure, and contactless.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* QR Scanner Card */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <QrCode className="h-6 w-6 text-primary" />
                <span>Scan QR Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showScanner ? (
                <div className="text-center space-y-4">
                  <div className="bg-primary/10 p-8 rounded-xl">
                    <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Point your camera at the QR code in the bus
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setError(null);
                      setShowScanner(true);
                    }}
                    className="w-full"
                    size="lg"
                  >
                    <QrCode className="h-5 w-5 mr-2" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                  <div className="rounded-xl overflow-hidden border-2 border-primary/20 bg-black relative">
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
                    variant="outline"
                    onClick={() => {
                      setShowScanner(false);
                      setError(null);
                    }}
                    className="w-full"
                  >
                    Close Camera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Input Card */}
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Ticket className="h-6 w-6 text-primary" />
                <span>Enter Trip Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="bg-muted/50 p-6 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    If you can't scan the QR code, enter the trip code manually
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-blue-800 mb-2">
                      Demo Trip Codes:
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setQrInput("trip-1-qr")}
                        className="text-xs bg-blue-100 px-2 py-1 rounded font-mono mx-1"
                      >
                        trip-1-qr
                      </button>
                      <button
                        onClick={() => setQrInput("trip-xyz0392")}
                        className="text-xs bg-blue-100 px-2 py-1 rounded font-mono mx-1"
                      >
                        trip-xyz0392
                      </button>
                      <button
                        onClick={() => setQrInput("trip-abc123")}
                        className="text-xs bg-blue-100 px-2 py-1 rounded font-mono mx-1"
                      >
                        trip-abc123
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-input">Trip Code</Label>
                  <Input
                    id="qr-input"
                    placeholder="e.g., trip-xyz123"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    className="text-center text-lg font-mono"
                  />
                </div>
                <Button
                  onClick={handleManualQR}
                  disabled={!qrInput.trim()}
                  className="w-full"
                  size="lg"
                >
                  Continue to Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Quick Scanning</h3>
            <p className="text-sm text-muted-foreground">
              Instant QR code recognition for seamless booking
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
              <Ticket className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Digital Tickets</h3>
            <p className="text-sm text-muted-foreground">
              Paperless e-tickets delivered instantly to your device
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
              <Smartphone className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Contactless Payment</h3>
            <p className="text-sm text-muted-foreground">
              Secure online payment with multiple options
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
