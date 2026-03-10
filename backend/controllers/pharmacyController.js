const Pharmacy = require('../models/Pharmacy');
const Order = require('../models/Order');

// Get all medicines in the store
exports.getStoreMedicines = async (req, res) => {
  try {
    const medicines = await Pharmacy.find();
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching store items" });
  }
};

// Place a new order
exports.placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, address } = req.body;
    const order = new Order({
      patient: req.user.id,
      items,
      totalAmount,
      address
    });
    await order.save();
    res.status(201).json({ message: "Order placed successfully!", order });
  } catch (error) {
    res.status(500).json({ message: "Order failed" });
  }
};