import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Bus,
  MapPin,
  Clock,
  User,
  Phone,
  Download,
  Share2,
  CheckCircle,
} from "lucide-react";
import QRCode from "qrcode";

export default function TicketConfirmation() {
  const { ticketId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(
    location.state?.ticket || null,
  );
  const [qrCode, setQrCode] = useState<string>(location.state?.qrCode || "");
  const [loading, setLoading] = useState(!ticket);

  useEffect(() => {
    if (ticket && ticketId) {
      fetchTicket();
    }
  }, []);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) {
        throw new Error("Ticket not found");
      }
      const data = await response.json();
      setTicket(data.ticket);

      const qrDataUrl = await QRCode.toDataURL(`http://localhost:3000/ticket/${ticketId}`);
      setQrCode(qrDataUrl)
    } catch (err) {
      console.error("Failed to fetch ticket:", err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // In production, generate PDF ticket
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bus Ticket",
          text: `My bus ticket for ${ticket?.boardingStop} to ${ticket?.destinationStop}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <h3 className="font-semibold text-lg mb-2">Ticket Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The ticket you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-2 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Booking Confirmed!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your e-ticket is ready
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Payment Successful!
          </h2>
          <p className="text-muted-foreground">
            Your ticket has been booked and confirmed. Show this QR code to the
            conductor.
          </p>
        </div>

        {/* Ticket Card */}
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Bus className="h-5 w-5 text-primary" />
                <span>E-Ticket</span>
              </CardTitle>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {ticket.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Ticket Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Journey Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{ticket.boardingStop}</p>
                        <p className="text-sm text-muted-foreground">
                          to {ticket.destinationStop}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(ticket.bookingTime).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Booked at{" "}
                          {new Date(ticket.bookingTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Passenger Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{ticket.passengerName}</p>
                        <p className="text-sm text-muted-foreground">
                          Passenger
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{ticket.passengerPhone}</p>
                        <p className="text-sm text-muted-foreground">Contact</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Fare:</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{ticket.fare}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Payment Status:{" "}
                    <span className="text-green-600 font-medium">
                      Completed
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border-l border-border/50 pl-6">
                <div className="bg-white p-4 rounded-xl border-2 border-primary/20 mb-4">
                  {qrCode ? (
                    <img
                      src={qrCode}
                      alt="Ticket QR Code"
                      className="w-40 h-40"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground text-sm text-center">
                        QR Code
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-center text-muted-foreground mb-2">
                  Show this QR code to the conductor
                </p>
                <p className="text-xs text-center text-muted-foreground font-mono">
                  Ticket ID: {ticket.ticketId.slice(0, 8)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 border border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-blue-900">
              Important Instructions:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Keep this e-ticket handy for verification by the conductor
              </li>
              <li>• The QR code contains your ticket information</li>
              <li>• No refunds available once the journey has started</li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button onClick={() => navigate("/")} variant="outline" size="lg">
            Book Another Ticket
          </Button>
        </div>
      </main>
    </div>
  );
}
