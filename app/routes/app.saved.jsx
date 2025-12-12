/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Trash2, Pencil, Download, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

// --- Custom Confirmation Modal Component (Mandatory Replacement for confirm()) ---
const ConfirmationModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all duration-300 scale-100">
        <div className="text-center">
          <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Confirm Deletion
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to permanently delete this invoice? This
            action cannot be undone.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition duration-150"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 shadow-md hover:bg-red-700 transition duration-150"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- End Modal Component ---

// --- Placeholder for the Invoice Form Component ---
const InvoiceFormPlaceholder = ({ setPage }) => {
  // This is a placeholder for the actual Invoice creation/editing page
  // which the original code tried to navigate to.
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-start justify-center">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-3xl">
        <button
          onClick={() => setPage("list")}
          className="flex items-center text-teal-600 hover:text-teal-800 mb-6 font-medium transition duration-150"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Invoice History
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Invoice Creation / Edit Form
        </h1>
        <p className="text-gray-600 mb-6">
          This is a placeholder view. In a full application, the invoice form
          logic would reside here.
        </p>
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
          Data for the invoice being edited/downloaded is stored in
          `localStorage` under the key `editInvoice`.
        </div>
      </div>
    </div>
  );
};

export default function SavedInvoicesPage() {
  // New state to manage the view (simulating routing)
  const [page, setPage] = useState("list");

  // UI state for the confirmation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceToDeleteIndex, setInvoiceToDeleteIndex] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then(setInvoices);
  }, []);

  // Function to trigger the modal
  const openDeleteModal = (index) => {
    setInvoiceToDeleteIndex(index);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    // Using "INR" currency code for the Indian Rupee symbol, as the original used '₹'
    return isNaN(num)
      ? "₹0.00"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(num);
  };

  const confirmDelete = () => {
    if (invoiceToDeleteIndex === null) {
      setIsModalOpen(false);
      return;
    }

    const index = invoiceToDeleteIndex;

    // Original deletion logic
    const updated = [...invoices];
    updated.splice(index, 1);
    localStorage.setItem("invoices", JSON.stringify(updated));
    setInvoices(updated);

    // Close modal and reset state
    setIsModalOpen(false);
    setInvoiceToDeleteIndex(null);
  };

  const editInvoice = (id) => {
    console.log("id -z", id);

    localStorage.setItem("editIndex", id);
    navigate("/app/invoice");
  };

  const downloadInvoice = (id) => {
    localStorage.setItem("editIndex", id);
    navigate("/app/invoice?download=1");
  };

  if (page === "form") {
    return <InvoiceFormPlaceholder setPage={setPage} />;
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header and CTA */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Invoice History
          </h1>
          <button
            onClick={() => navigate("/app/invoice")} // Changed from navigate to state change
            className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition duration-150 text-sm flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            Create New Invoice
          </button>
        </div>

        {invoices.length === 0 && (
          <div className="bg-white p-10 rounded-xl shadow-lg border-2 border-dashed border-gray-200 text-center mt-12">
            <p className="text-xl font-medium text-gray-700 mb-2">
              No Invoices Found
            </p>
            <p className="text-gray-500 max-w-lg mx-auto">
              It looks like you haven't saved any invoices yet. Click below to
              start generating your first professional invoice!
            </p>
            <button
              onClick={() => navigate("/app/invoice")} // Changed from navigate to state change
              className="mt-6 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-150"
            >
              Create First Invoice
            </button>
          </div>
        )}

        {invoices.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden ring-1 ring-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                      Invoice No
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-600 uppercase tracking-wider min-w-[150px]">
                      Customer
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="p-4 text-center font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv, index) => (
                    <tr
                      key={index}
                      className="hover:bg-teal-50 transition duration-100 even:bg-white odd:bg-gray-50"
                    >
                      <td className="p-4 text-gray-500">{index + 1}</td>
                      <td className="p-4 font-semibold text-teal-700">
                        {inv.invoiceNumber || "N/A"}
                      </td>
                      <td className="p-4 text-gray-700">
                        {inv.customerName || "No Name"}
                      </td>
                      <td className="p-4 text-gray-500">
                        {inv.invoiceDate || "N/A"}
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {formatCurrency(inv.total)}
                      </td>

                      <td className="p-4">
                        <div className="flex gap-1 justify-center">
                          {/* EDIT */}
                          <button
                            onClick={() => editInvoice(inv.id)}
                            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition duration-150 group"
                            title="Edit Invoice"
                          >
                            <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>

                          {/* DOWNLOAD */}
                          <button
                            onClick={() => downloadInvoice(inv.id)}
                            className="p-2 rounded-full text-green-600 hover:bg-green-100 transition duration-150 group"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>

                          {/* DELETE (Calls the modal trigger) */}
                          <button
                            onClick={() => openDeleteModal(index)}
                            className="p-2 rounded-full text-red-600 hover:bg-red-100 transition duration-150 group"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal Component Renders outside the main flow */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
