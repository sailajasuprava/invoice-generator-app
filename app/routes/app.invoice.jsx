/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAppBridge } from "@shopify/app-bridge-react";

// 1. IMPORT ICONS from lucide-react
import {
  Building,
  User,
  FileText,
  BarChart2,
  Eye,
  Save,
  Download,
  Plus,
  Trash2,
  Calendar,
  List,
  Loader2,
} from "lucide-react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

// --- REUSABLE COMPONENTS (Helpers) ---

// Updated Card component to accept a React Icon Component
const Card = ({ title, icon: IconComponent, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-100 transition-all duration-300">
    <div className="flex items-center mb-5">
      <IconComponent className="w-5 h-5 mr-2 text-blue-600" />
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  className = "",
}) => (
  <div className="flex flex-col mb-4">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full px-4 py-3 border rounded-lg text-sm transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 ${
        readOnly
          ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-white border-gray-300 focus:border-blue-500"
      } ${className}`}
    />
  </div>
);

const DateInput = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col mb-4 relative">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        // Custom style to show date picker icon consistently
        className="w-full px-4 py-3 border rounded-lg text-sm appearance-none pr-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        style={{ colorScheme: "light" }}
      />
      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
    </div>
  </div>
);

const PrimaryButton = ({ onClick, children, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center whitespace-nowrap ${className}`}
  >
    {children}
  </button>
);

const SecondaryButton = ({ onClick, children, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold py-2 px-3 rounded-lg shadow-sm transition duration-150 ease-in-out flex items-center justify-center whitespace-nowrap ${className}`}
  >
    {children}
  </button>
);

const SummaryRow = ({ label, value, isTotal = false }) => (
  <div className={`flex justify-between items-center ${isTotal ? "mt-2" : ""}`}>
    <span
      className={
        isTotal ? "text-black font-semibold text-xl" : "text-sm text-gray-600"
      }
    >
      {label}
    </span>
    <span
      className={
        isTotal
          ? "text-2xl font-bold text-teal-500"
          : "text-sm font-medium text-gray-600"
      }
    >
      ₹{value}
    </span>
  </div>
);

// --- MAIN APP COMPONENT ---
const App = () => {
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    const loadInvoiceForEdit = async () => {
      const id = localStorage.getItem("editIndex");
      if (!id) return;

      try {
        const res = await fetch("/api/invoices");
        if (!res.ok) throw new Error("Failed to fetch invoices");

        const all = await res.json();
        const invoice = all.find((inv) => inv.id === id);
        if (!invoice) return;

        setEditingIndex(invoice.id);

        setInvoiceNumber(invoice.invoiceNumber || "");
        setInvoiceDate(invoice.invoiceDate || "");
        setDueDate(invoice.dueDate || "");
        setBusinessName(invoice.businessName || "");
        setBusinessAddress(invoice.businessAddress || "");
        setGistn(invoice.gistn || "");
        setCustomerName(invoice.customerName || "");
        setBillingAddress(invoice.billingAddress || "");
        setEmail(invoice.email || "");
        setMobile(invoice.mobile || "");
        setLineItems(invoice.lineItems || []);
      } catch (error) {
        console.error("Error loading invoice:", error);
      }
    };

    loadInvoiceForEdit();
  }, []);

  const app = useAppBridge();
  const [loading, setLoading] = useState(false);

  // --- FORM STATE ---
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gistn, setGistn] = useState("22AAAAA0000A1Z5");
  const [customerName, setCustomerName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");

  const [lineItems, setLineItems] = useState([
    {
      id: 1,
      name: "",
      hsn: "",
      qty: 1,
      price: 0.0,
      gst: 18,
      total: "0.00",
    },
  ]);

  // --- TOAST MANAGEMENT ---
  const showLocalToast = (message, isError = false) => {
    app.toast.show(message, { isError });
  };

  // --- CALCULATIONS ---
  const calculateTotal = useCallback((qty, price, gst) => {
    const q = Number(qty) || 0;
    const p = Number(price) || 0;
    const g = Number(gst) || 0;
    const base = q * p;
    const total = base * (1 + g / 100);
    return total.toFixed(2);
  }, []);

  useEffect(() => {
    setLineItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        total: calculateTotal(item.qty, item.price, item.gst),
      })),
    );
  }, [
    lineItems
      .map((i) => [i.qty, i.price, i.gst])
      .flat()
      .join(","),
    calculateTotal,
  ]);

  const calculateSummary = () => {
    let subtotal = 0;
    let gstTotal = 0;

    lineItems.forEach((item) => {
      const q = Number(item.qty) || 0;
      const p = Number(item.price) || 0;
      const g = Number(item.gst) || 0;

      const base = q * p;
      const itemGst = base * (g / 100);

      subtotal += base;
      gstTotal += itemGst;
    });

    const total = subtotal + gstTotal;

    return {
      subtotal: subtotal.toFixed(2),
      gstTotal: gstTotal.toFixed(2),
      cgst: (gstTotal / 2).toFixed(2),
      sgst: (gstTotal / 2).toFixed(2),
      igst: "0.00",
      total: total.toFixed(2),
    };
  };

  const summary = calculateSummary();

  // --- LINE ITEM HANDLERS ---
  const updateItem = (id, field, value) => {
    setLineItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: "",
      hsn: "",
      qty: 1,
      price: 0,
      gst: 18,
      total: "0.00",
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeItem = (id) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  // --- BUTTON ACTIONS ---
  const previewInvoice = () => {
    const printContent = document.getElementById("invoice-preview");
    const WindowPrint = window.open("", "", "width=900,height=650");

    WindowPrint.document.write(printContent.innerHTML);
    WindowPrint.document.close();
    WindowPrint.focus();
    WindowPrint.print();
  };

  const saveInvoice = async () => {
    setLoading(true);

    try {
      if (!invoiceNumber || invoiceNumber.trim() === "") {
        showLocalToast("Invoice Number is required!");
        return; // Stop the API call
      }

      if (
        lineItems.length === 0 ||
        lineItems.some((item) => !item.name.trim() || Number(item.price) <= 0)
      ) {
        showLocalToast(
          "Please add at least one line item with a name and price.",
        );
        return;
      }
      const payload = {
        id: editingIndex ?? null,
        invoiceNumber,
        invoiceDate,
        dueDate,
        businessName,
        businessAddress,
        gistn,
        customerName,
        billingAddress,
        email,
        mobile,
        summary: {
          subtotal: Number(summary.subtotal),
          cgst: Number(summary.cgst),
          sgst: Number(summary.sgst),
          igst: Number(summary.igst),
          total: Number(summary.total),
        },
        lineItems: lineItems.map((item) => ({
          name: item.name,
          hsn: item.hsn,
          qty: Number(item.qty),
          price: Number(item.price),
          gst: Number(item.gst),
          total: Number(item.total),
        })),
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.ok) {
        showLocalToast(editingIndex ? "Invoice updated ✔" : "Invoice saved ✔");
      }
    } catch (error) {
      console.error("Save invoice error:", error);
      showLocalToast("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }

    setLoading(false);
  };

  const downloadPDF = () => {
    const element = document.getElementById("invoice-preview");

    localStorage.removeItem("editIndex");

    if (!element) {
      alert("Invoice preview not found!");
      return;
    }

    // 1️⃣ Temporarily show the content
    element.style.display = "block";

    // 2️⃣ Use timeout to allow DOM paint
    setTimeout(() => {
      html2canvas(element, {
        scale: 2,
        useCORS: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = pdfHeight;
        let position = 0;

        // 3️⃣ Add pages if needed
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft > 0) {
          position -= pdf.internal.pageSize.getHeight();
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pdf.internal.pageSize.getHeight();
        }

        pdf.save(`${invoiceNumber || "invoice"}.pdf`);

        // 4️⃣ Hide it again when done
        element.style.display = "none";
      });
    }, 200);
  };

  return (
    // The main container explicitly sets the background and font to help isolate styles
    <div className="min-h-screen bg-gray-50 p-4 sm:p-10 pb-24 font-sans relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Create Invoice
          </h1>
          <p className="text-gray-500 mt-1">
            Fill in the details below to generate your invoice
          </p>
        </header>

        {/* 3. Using Lucide Icons for Cards */}
        <Card title="Business Details" icon={Building}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div className="md:col-span-2">
              <TextInput
                label="Business Name"
                placeholder="Acme Global"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <TextInput
                label="Address"
                placeholder="123 Main St, Anytown, CA 90210"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <TextInput label="GSTIN" value={gistn} readOnly />
            </div>
          </div>
        </Card>

        {/* Customer Details */}
        <Card title="Customer Details" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div className="md:col-span-2">
              <TextInput
                label="Customer Name"
                placeholder="Jane Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <TextInput
                label="Billing Address"
                placeholder="456 Oak Ave, Otherville, NY 10001"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
              />
            </div>
            <TextInput
              label="Email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextInput
              label="Mobile Number"
              placeholder="+91 98765 43210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>
        </Card>

        {/* Invoice Details Card */}
        <Card title="Invoice Details" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <TextInput
              label="Invoice Number"
              placeholder="INV-2024-001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
            <DateInput
              label="Invoice Date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
            <DateInput
              label="Due Date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="mm/dd/yyyy"
            />
          </div>
        </Card>

        {/* Line Items */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-100">
          {/* Header and Add Item Button */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center">
              <List className="w-5 h-5 mr-2 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Line Items
              </h2>
            </div>
            <PrimaryButton onClick={addItem} className="py-2 px-4 text-sm">
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </PrimaryButton>
          </div>

          {/* Table Header (Desktop/Tablet view) */}
          <div className="hidden lg:grid grid-cols-12 gap-3 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200 py-3 mb-2">
            <div className="col-span-4">Item Name</div>
            <div className="col-span-1">HSN Code</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Unit Price (₹)</div>
            <div className="col-span-1 text-center">GST (%)</div>
            <div className="col-span-2 text-right pr-4">Total (₹)</div>
          </div>

          {/* Line Item Rows */}
          {lineItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center py-3 border-b border-gray-100 last:border-b-0 relative"
            >
              {/* Item Name */}
              <input
                placeholder="Enter item name"
                value={item.name}
                className="col-span-4 w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onChange={(e) => updateItem(item.id, "name", e.target.value)}
              />

              {/* HSN Code */}
              <input
                placeholder="HSN"
                value={item.hsn}
                className="col-span-1 w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onChange={(e) => updateItem(item.id, "hsn", e.target.value)}
              />

              {/* Quantity */}
              <input
                type="number"
                value={item.qty}
                className="col-span-2 w-full px-3 py-2 border rounded-lg text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onChange={(e) => updateItem(item.id, "qty", e.target.value)}
              />

              {/* Unit Price */}
              <input
                type="number"
                step="0.01"
                value={item.price}
                className="col-span-2 w-full px-3 py-2 border rounded-lg text-sm text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onChange={(e) => updateItem(item.id, "price", e.target.value)}
              />

              {/* GST % */}
              <select
                value={item.gst}
                className="col-span-1 w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onChange={(e) => updateItem(item.id, "gst", e.target.value)}
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>

              {/* Total & Delete Button */}
              <div className="col-span-2 flex justify-end items-center text-right font-bold text-gray-700">
                <span className="mr-2">₹{item.total}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out p-1 rounded-full hover:bg-red-50"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <Card title="Summary" icon={BarChart2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notes/Terms Section - Placeholder for more fields */}
            <div className="md:col-span-1"></div>

            {/* Summary Table */}
            <div className="md:col-span-1 p-6 pt-0 rounded-xl">
              <div className="space-y-6">
                <SummaryRow label="Subtotal" value={summary.subtotal} />
                <SummaryRow label="CGST" value={summary.cgst} />
                <SummaryRow label="SGST" value={summary.sgst} />
                <SummaryRow label="IGST" value={summary.igst} />
                <div className="h-px bg-gray-300 my-3"></div>
                <SummaryRow
                  label="Total Amount"
                  value={summary.total}
                  isTotal={true}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sticky Footer for Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-4 z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-end gap-3">
          <SecondaryButton onClick={previewInvoice}>
            <Eye className="w-5 h-5 mr-2" /> Preview Invoice
          </SecondaryButton>

          <button
            type="button"
            onClick={saveInvoice}
            disabled={loading}
            className="bg-teal-500 hover:bg-teal-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Invoice
              </>
            )}
          </button>

          <PrimaryButton onClick={downloadPDF}>
            <Download className="w-5 h-5 mr-2" /> Download PDF
          </PrimaryButton>
        </div>
      </div>

      <div id="invoice-preview" style={{ display: "none" }}>
        <style>
          {`
            body { font-family: Arial; }
            .invoice-box {
              width: 100%;
              padding: 20px;
              font-size: 14px;
              line-height: 1.4;
            }

            .header-section {
              margin-bottom: 20px;
            }

            .invoice-title {
              font-size: 26px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 30px;
              text-transform: uppercase;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }

            table th, table td {
              border: 1px solid #ccc;
              padding: 8px;
            }

            table th {
              background: #f4f4f4;
              font-weight: bold;
              text-align: center;
            }

            .right {
              text-align: right;
            }

            .footer {
              text-align: center;
              margin-top: 40px;
              font-size: 12px;
              opacity: 0.8;
            }
    `}
        </style>
        <div
          id="pdf-wrapper"
          style={{
            padding: "40px",
            background: "white",
          }}
        >
          <div className="invoice-box">
            <div className="header-section">
              <h1 className="invoice-title">Invoice</h1>

              <table>
                <tr>
                  <td>
                    <b>Business Details:</b>
                    <br />
                    {businessName}
                    <br />
                    {businessAddress}
                    <br />
                    GSTIN: {gistn}
                  </td>
                  <td>
                    <b>Customer Details:</b>
                    <br />
                    {customerName}
                    <br />
                    {billingAddress}
                    <br />
                    Email: {email}
                    <br />
                    Phone: {mobile}
                  </td>
                </tr>
              </table>
            </div>

            <table>
              <tr>
                <td>
                  <b>Invoice No:</b> {invoiceNumber}
                </td>
                <td>
                  <b>Invoice Date:</b> {invoiceDate}
                </td>
                <td>
                  <b>Due Date:</b> {dueDate || "-"}
                </td>
              </tr>
            </table>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>GST%</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>

              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td>{item.hsn}</td>
                    <td className="right">{item.qty}</td>
                    <td className="right">{item.price}</td>
                    <td className="right">{item.gst}</td>
                    <td className="right">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* <!-- SUMMARY --> */}
            <table>
              <tr>
                <td>
                  <b>Subtotal:</b>
                </td>
                <td className="right">₹{summary.subtotal}</td>
              </tr>
              <tr>
                <td>
                  <b>CGST:</b>
                </td>
                <td className="right">₹{summary.cgst}</td>
              </tr>
              <tr>
                <td>
                  <b>SGST:</b>
                </td>
                <td className="right">₹{summary.sgst}</td>
              </tr>
              <tr>
                <td>
                  <b>IGST:</b>
                </td>
                <td className="right">₹{summary.igst}</td>
              </tr>
              <tr>
                <td>
                  <b>Total:</b>
                </td>
                <td className="right">
                  <b>₹{summary.total}</b>
                </td>
              </tr>
            </table>

            <div className="footer">
              Thank you for your business!
              <br />
              This is a system generated invoice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
