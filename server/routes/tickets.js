import { v4 as uuidv4 } from "uuid";
import { busCollection, routeCollection, ticketCollection, userCollection } from "../database.js";
import { ObjectId } from "mongodb";

export const handleBookTicket = async (req, res) => {
  try {
    const {
      routeNo,
      passengerName,
      passengerPhone,
      boardingStop,
      destinationStop,
      fare,
      passengerId,
      busId,
      expirationDuration
    } = req.body;

    console.log(req.body)
    if (
      !routeNo ||
      !passengerName ||
      !passengerPhone ||
      !boardingStop ||
      !destinationStop ||
      !fare ||
      !passengerId ||
      !busId ||
      !expirationDuration
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const ticketId = uuidv4();

    const ticket = {
      ticketId,
      busId,
      routeNo, // In production, use authenticated user ID
      passengerName,
      passengerId: passengerId,
      passengerPhone,
      boardingStop,
      destinationStop,
      fare,
      bookingTime: new Date(),
      status: "booked",
      paymentStatus: "completed", // Mock payment as completed
      expirationDuration
    };

    await ticketCollection.insertOne(ticket)

    res.status(201).json({ ticket, });
  } catch (error) {
    console.error("Book ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleValidateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.userId;

    if (userRole !== "conductor" && userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Only conductors and admins can validate tickets" });
    }

    const ticket = await ticketCollection.findOne({ ticketId })
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }


    if (ticket.status === "verified") {
      return res.status(400).json({ message: "Ticket already verified" });
    }

    if (ticket.status === "expired") {
      return res.status(400).json({ message: "Ticket has expired" });
    }

    // Update ticket status in the array

    res.json({
      message: "Ticket verified successfully",
      ticket: ticket,
    });
  } catch (error) {
    console.error("Validate ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGetConductorDashboard = async (req, res) => {
  try {
    const { conductorId } = req.params;

    const conductor = await userCollection.findOne({ _id: new ObjectId(conductorId) })
    if (!conductor) {
      return res.status(200).json({ message: 'Conductor not Found' })
    }

    const bus = await busCollection.findOne({ _id: new ObjectId(conductor.busId) })
    if (!bus) {
      return res.status(200).json({ message: 'Conductor not assigned with bus' })
    }

    const tickets = await ticketCollection.find({ busId: bus._id.toString() }).toArray()

    if (!tickets) {
      return res.status(200).json({ message: 'No Tickets Found' })
    }

    const route = await routeCollection.findOne({ routeNo: bus.routeNo })
    if (!route) {
      return res.status(200).json({ message: 'Invalid Route' })
    }
    let revenue = 0
    for (var i = 0; i < tickets.length; i++) {
      revenue += tickets[i].fare;
    }

    res.json({
      passengers: tickets.length,
      tickets: tickets,
      bus: bus,
      route: route,
      revenue: revenue
    })

  } catch (error) {
    console.error("Get conductor dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGetTicket = async (
  req,
  res,
) => {
  try {
    const { ticketId } = req.params;

    const ticket = await ticketCollection.findOne({ ticketId })
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({ ticket });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleUpdateTripStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;
    const conductorId = req.user?.userId;

    ;
  } catch (error) {
    console.error("Update trip status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
