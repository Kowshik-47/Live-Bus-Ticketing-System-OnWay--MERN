const { busCollection, routeCollection } = require("../database");

export const handleGetTripDetails = async (req, res) => {
  try {
    const { routeId } = req.params;

    const bus = await busCollection.findOne({ routeId: routeId })

    if (!bus)
      return res.status(200).json({ message: 'Bus Not Found' })

    const route = await routeCollection.findOne({ _id: bus.routeId })

    res.send(route)
  } catch (error) {
    console.error("Get trip details error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
