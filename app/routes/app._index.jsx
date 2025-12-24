/* eslint-disable react/prop-types */

import { Zap, Shield, Download } from "lucide-react";
import { useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query shopInfo {
      shop {
        name
      }
    }`,
  );

  const responseJson = await response.json();

  return {
    shopName: responseJson.data.shop.name,
  };
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
// Main App Component for the Landing Page
export default function App() {
  const navigate = useNavigate();

  // Helper component for the feature cards
  const FeatureCard = ({
    icon: Icon,
    title,
    description,
    bgColor,
    iconColor,
  }) => (
    <div className="bg-gray-50 p-8 rounded-2xl w-full max-w-sm text-center transition-shadow duration-300 hover:shadow-xl hover:shadow-gray-200">
      <div
        className={`w-14 h-14 mx-auto mb-5 rounded-xl flex items-center justify-center ${bgColor}`}
      >
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </div>
      <h3 className="mb-3 text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );

  // Mock Invoice Card Component - Replicates the look of the floating card in the hero
  const MockInvoiceCard = () => (
    <div className="w-full max-w-4xl lg:max-w-xl bg-white p-6 sm:p-10 rounded-2xl shadow-[0_15px_60px_rgba(0,0,0,0.1)] transition-transform duration-500 scale-95 lg:scale-100">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
        <div className="text-left">
          <strong className="text-base font-bold text-gray-800">
            Invoice #INV-001
          </strong>
          <p className="text-xs text-gray-500 mt-1">Date: November 27, 2024</p>
        </div>
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-md">
          Draft
        </span>
      </div>

      {/* Addresses */}
      <div className="flex flex-col sm:flex-row justify-between mb-8 text-xs gap-6 sm:gap-10">
        <div className="text-left flex-1">
          <strong className="font-bold text-gray-700">From:</strong>
          <div className="text-gray-500 mt-1 leading-relaxed">
            Your Business Name
            <br />
            123 Business Street
            <br />
            City, State 12345
          </div>
        </div>
        <div className="text-left flex-1">
          <strong className="font-bold text-gray-700">To:</strong>
          <div className="text-gray-500 mt-1 leading-relaxed">
            Client Name
            <br />
            456 Client Avenue
            <br />
            City, State 67890
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 font-semibold text-gray-500 w-1/2">
                Description
              </th>
              <th className="text-left py-3 font-semibold text-gray-500">
                Quantity
              </th>
              <th className="text-left py-3 font-semibold text-gray-500">
                Rate
              </th>
              <th className="text-right py-3 font-semibold text-gray-500">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="text-left">
            <tr>
              <td className="py-3 text-gray-700 font-medium">
                Web Design Service
              </td>
              <td className="py-3 text-gray-500">1</td>
              <td className="py-3 text-gray-500">₹2,500.00</td>
              <td className="py-3 text-right text-gray-700">₹2,500.00</td>
            </tr>
            <tr>
              <td className="py-3 text-gray-700 font-medium">Development</td>
              <td className="py-3 text-gray-500">1</td>
              <td className="py-3 text-gray-500">₹1,500.00</td>
              <td className="py-3 text-right text-gray-700">₹1,500.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mt-6 pt-5 border-t-2 border-gray-100">
        <strong className="text-base font-bold text-gray-800">Total</strong>
        <strong className="text-xl font-extrabold text-green-600">
          ₹4,000.00
        </strong>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* HERO SECTION */}
      <div
        className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pb-40"
        style={{
          background: "linear-gradient(180deg, #E8F9F3 0%, #FFFFFF 100%)",
          clipPath: "ellipse(150% 100% at 50% 0%)", // Soft wave effect for the top gradient
        }}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Badge */}
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 tracking-wider mb-6">
            FREE TOOL
          </span>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-4 max-w-4xl">
            Free Invoice <span className="text-teal-600">Generator</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 font-normal mb-8 max-w-xl">
            Create a professional invoice in minutes without any hidden costs.
          </p>

          {/* Button */}
          <button
            onClick={() => navigate("/app/invoice")}
            className="px-8 py-3.5 text-base font-semibold rounded-lg text-white bg-gray-900 shadow-lg shadow-gray-900/20 transition duration-300 hover:bg-gray-700 mb-20 sm:mb-24 lg:mb-32"
          >
            Create Invoice
          </button>

          {/* Invoice Card Display */}
          <MockInvoiceCard />
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="py-20 sm:py-28 px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-snug">
            Why Choose Our Invoice Generator?
          </h2>

          <p className="text-base text-gray-600 mb-16 max-w-3xl mx-auto">
            Create professional invoices in minutes with our easy-to-use, free
            tool designed for businesses of all sizes.
          </p>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Generate your invoice in under 60 seconds with our intuitive, streamlined interface."
              bgColor="bg-green-100"
              iconColor="text-green-700"
            />
            <FeatureCard
              icon={Shield}
              title="100% Secure"
              description="Your data is protected. We process everything client-side and never store your information."
              bgColor="bg-blue-100"
              iconColor="text-blue-700"
            />
            <FeatureCard
              icon={Download}
              title="Instant Download"
              description="Download your completed invoice immediately as a high-quality PDF. No registration needed."
              bgColor="bg-purple-100"
              iconColor="text-purple-700"
            />
          </div>
        </div>
      </div>

      {/* READY TO CREATE CTA SECTION */}
      <div className="bg-gray-800 py-20 px-6 sm:py-24 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Create Your First Invoice?
          </h2>
          <p className="text-base text-gray-300 mb-8">
            Join thousands of businesses who trust our free invoice generator
            for their billing needs.
          </p>
          <button
            onClick={() => navigate("/app/invoice")}
            className="px-10 py-4 text-base font-semibold rounded-lg text-gray-900 bg-white shadow-xl transition duration-300 hover:bg-gray-100"
          >
            Start Creating Now
          </button>
        </div>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
