const express = require("express");
const bodyParser = require("body-parser");
const pdfkit = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 7003;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const drawTable = (doc, data, startX, startY) => {
  const rowHeight = 30;
  const colWidths = [150, 150, 150];

  doc.fontSize(12).font("Helvetica-Bold");
  doc.text("Term", startX, startY);
  doc.text("Details", startX + colWidths[0], startY);

  doc
    .moveTo(startX, startY + rowHeight)
    .lineTo(
      startX + colWidths[0] + colWidths[1] + colWidths[2],
      startY + rowHeight
    )
    .stroke();

  doc.fontSize(12).font("Helvetica");
  let yPosition = startY + rowHeight + 5;
  data.forEach((row) => {
    doc.text(row.item, startX, yPosition);
    doc.text(row.details, startX + colWidths[0], yPosition);
    doc.text(row.amount, startX + colWidths[0] + colWidths[1], yPosition);
    yPosition += rowHeight;
  });

  doc
    .moveTo(startX, yPosition)
    .lineTo(startX + colWidths[0] + colWidths[1] + colWidths[2], yPosition)
    .stroke();
};

app.post("/pay", (req, res) => {
  const { name, billType, amount, dueDate } = req.body;

  const sanitizedFileName = name.replace(/[^a-zA-Z0-9]/g, "_");

  const doc = new pdfkit();
  const fileName = `${sanitizedFileName}_invoice.pdf`;
  const filePath = path.join(__dirname, "uploads", fileName);

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("Utility Bill Invoice", { align: "center" });

  const billDetails = [
    { item: "Name", details: name, amount: "" },
    { item: "Bill Type", details: billType, amount: "" },
    { item: "Amount(Rupee)", details:  + amount, amount: "" },
    { item: "Due Date", details: dueDate, amount: "" },
  ];

  doc.moveDown();
  drawTable(doc, billDetails, 50, 100);

  doc.end();

  doc.on("finish", function () {
    res.send(`
            <h2>Payment Successful!</h2>
            <p>Thank you, ${name}. Your payment has been processed successfully.</p>
            <p>Your bill details are as follows:</p>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Bill Type:</strong> ${billType}</li>
                <li><strong>Amount:</strong> ${amount}</li>
                <li><strong>Due Date:</strong> ${dueDate}</li>
            </ul>
            <p>Click the link below to download your invoice:</p>
            <a href="/uploads/${fileName}" target="_blank">Download Invoice</a>
        `);
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
