const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
    userName: {type: String},
    batchName: {type: String},
    academyName: {type: String},
    amountPaid: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    enrollmentDate: { type: Date, required: true },
    invoiceNumber: { type: String, unique: true, required: true },
    invoiceUrl: { type: String }, // URL to the PDF invoice
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    academyId: { type: mongoose.Schema.Types.ObjectId, ref: "academies", required: true },
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
