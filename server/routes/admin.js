import QRCode from "qrcode";
import { busCollection, routeCollection, ticketCollection } from "../database.js";
import { ObjectId } from "mongodb";

export const handleGetAnalytics = async (req, res) => {
  const { division } = req.body

  try {
    const totalTrips = (await busCollection.find({}).toArray()).length;
    const activeTrips = (await busCollection.find({ status: 'active' }).toArray()).length
    const totalPassengers = (await ticketCollection.find({}).toArray()).length
    const result = await ticketCollection.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$fare" }
        }
      }
    ]).toArray();

    const totalRevenue = result[0]?.totalRevenue || 0;

    res.status(200).json({
      totalTrips,
      totalRevenue,
      totalPassengers,
      activeTrips,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetAllBuses = async (req, res) => {
  try {
    const buses = await busCollection.find({}).toArray()
    res.json({ buses })
  } catch (error) {
    console.error("Get buses error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGetAllRoutes = async (req, res) => {
  try {
    const routes = await routeCollection.find({}).toArray()
    res.json({ routes })
  } catch (error) {
    console.error("Get routes error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRouteById = async (req, res) => {
  const { routeId } = req.params

  const route = await routeCollection.findOne({ _id: new ObjectId(routeId) })

  if (!route) {
    return res.status(200).json({ message: 'Route Not Found' })
  }

  return res.send(route)
}

export async function updateRouteById(req, res) {
  const { routeId } = req.params
  const { routeNo, from, to, distance, stops } = req.body

  if (!routeId) {
    return res.status(200).json({ message: 'No Route Found' })
  }

  const updated = await routeCollection.findOneAndUpdate(
    { _id: new ObjectId(routeId) },
    {
      $set: {
        routeNo,
        from,
        to,
        distance,
        stops,
      },
    },
    {
      returnDocument: "after", // return updated document
    }
  );


  if (!updated) {
    return res.status(404).json({ error: "Route not found" })
  }

  res.json(updated)
}

export const handleCreateBus = async (req, res) => {
  try {
    const { vehicleNo, capacity, model, division } = req.body;

    if (!vehicleNo || !capacity || !model || !division) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingBus = await busCollection.find({ vehicleNo: vehicleNo })

    if (existingBus) {
      return res.status(400).json({ message: "Already a bus exist with this vehicle number" });
    }

    const newBus = {
      vehicleNo,
      capacity: parseInt(capacity),
      model,
      division,
      status: 'active',
      routeId: ''
    };

    await busCollection.insertOne(newBus)
    const bus = await busCollection.findOne({ vehicleNo: vehicleNo })
    const busId = bus._id

    // Auto-generate QR code for the new bus
    const bookingUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/book?bus=${busId}`;
    const qrDataUrl = await QRCode.toDataURL(bookingUrl, {
      width: 400,
      margin: 3,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    res.status(201).json({
      bus: newBus,
      qrCode: {
        bookingUrl,
        qrDataUrl,
        message: "QR code auto-generated for new bus",
      },
    });
  } catch (error) {
    console.error("Create bus error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export async function getRoute(req, res) {
  const { busId } = req.params

  const bus = await busCollection.findOne({ _id: new ObjectId(busId) })

  if (!bus)
    return res.status(200).json({ message: 'Barcode Invalid' })

  const route = await routeCollection.findOne({ routeNo: bus.routeNo })
  if (!route)
    return res.status(200).json({ message: 'Route Not Found' })
  res.send({ route, bus })
}

export const updateStop = async (req, res) => {
  const { busId } = req.params
  const { at } = req.body

  if (!busId || !at) {
    return res.status(200).json({ message: 'BusId and Location Found' })
  }

  const result = await busCollection.updateOne(
    { _id: new ObjectId(busId) },
    {
      $set: {
        at: at
      }
    }
  )

  if (result) {
    return res.status(400).json({ message: 'Updated Successfully' })
  }

}

export async function getBusById(req, res) {
  const { busId } = req.params;

  if (!busId) {
    return res.status(200).json({ message: 'Bus Not Found' })
  }
  const bus = await busCollection.findOne({ _id: new ObjectId(busId) })

  res.send(bus)
}

export const handleCreateRoute = async (req, res) => {
  try {
    const { routeNo, from, to, distance, stops } = req.body;
    console.log(req.body)
    if (!routeNo || !from || !to || !distance || !stops) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newRoute = {
      routeNo,
      from,
      to,
      distance: parseInt(distance),
      stops: Array.isArray(stops)
        ? stops
        : stops.split(",").map((s) => s.trim()),
    };

    const route = await routeCollection.find({ routeNo: routeNo })

    if (route)
      res.status(200).json({ message: 'Already Route Exists' })
    await routeCollection.insertOne(newRoute)

    res.status(201).json({ route: newRoute });
  } catch (error) {
    console.error("Create route error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGenerateBusQR = async (req, res) => {
  try {
    const { busId } = req.params;

    const bus = await busCollection.findOne({ _id: new ObjectId(busId) })
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    // Create bus-specific booking URL - passengers scan this to book for current trip
    const bookingUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/book?bus=${bus._id}`;

    // Generate QR code data URL with bus information
    const qrDataUrl = await QRCode.toDataURL(bookingUrl, {
      width: 400,
      margin: 3,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    res.json({
      busNumber: bus.number,
      qrDataUrl,
      bookingUrl,
      busInfo: {
        number: bus.number,
        model: bus.model,
        capacity: bus.capacity,
      },
    });
  } catch (error) {
    console.error("Generate bus QR error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
