const Invoice = require("../model/Invoice");

exports.getMyInvoices = async (req, res) => {
  try {
    const { id } = req.params; // Extract user ID from route params
    console.log('id',id)
    const invoices = await Invoice.find({ userId: id }); // Query invoices for the specific user
    res.status(200).json(invoices); // Return invoices as a JSON response
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ error: "Failed to fetch invoices. Please try again." });
  }
};
