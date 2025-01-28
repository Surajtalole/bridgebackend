const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
    userName: {type: String},
    batchName: {type: String},
    academyName: {type: String},
    amountPaid: { type: Number, require:true},
    paymentDate: { type: Date, default: Date.now },
    enrollmentDate: { type: Date },
    invoiceNumber: { type: String, unique: true, required: true },
    invoiceUrl: { type: String }, // URL to the PDF invoice
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch",  },
    academyId: { type: mongoose.Schema.Types.ObjectId, ref: "academies", },
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
