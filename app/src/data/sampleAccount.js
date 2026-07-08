window.__SAMPLE_ACCOUNT__ = {
  account: {
    accountIdMasked: "DEMO-ACCT-2048",
    billNumber: "DEMO-BILL-782913",
    billDate: "2026-05-23",
    billPeriod: "2026-05-24 to 2026-06-23",
    totalDueBeforeTax: 189.0,
    totalDue: 213.57,
    estimatedNextBill: 197.75,
    promoEnds: "2026-06-30",
    category: "synthetic demo",
    missingFields: []
  },
  summaryCards: [
    {
      label: "Bill change explanation",
      value: "Extra charges found",
      note: "555-0187: current recurring plan $10.00 before tax; one-time or roaming $18.00 before tax; device payment $44.00 before tax."
    },
    { label: "Total due", value: "$213.57", note: "Synthetic demo bill total." },
    { label: "Estimated next bill", value: "$197.75", note: "Before any new retention offer." },
    { label: "Change flags", value: "Bundle / HUP review", note: "Synthetic demo includes device payment, roaming, and promo expiry." }
  ],
  services: [
    {
      type: "Wireless",
      account: "555-0142",
      sourcePage: 3,
      tier: "Essentials",
      originalPrice: 85.0,
      discounts: [
        { name: "Additional Line Promo", amount: -40.0, expiryDate: null },
        { name: "Employee Discount", amount: -15.0, expiryDate: null },
        { name: "Wireless Plan", amount: -10.0, expiryDate: null },
        { name: "Automatic Payments Discount", amount: -5.0, expiryDate: null }
      ],
      planMonthly: 15.0,
      thisBillTotal: 16.8,
      oneTimeCharges: 0,
      deviceChargesBeforeTax: 0,
      deviceCharges: 0,
      priceBeforeTax: 15.0,
      priceAfterTax: 16.8,
      contractEnd: "n/a",
      lineLabel: "BYOD",
      addOn: "No add-on visible",
      discountSummary: "Additional Line Promo + Employee Discount",
      details: null
    },
    {
      type: "Wireless",
      account: "555-0187",
      sourcePage: 4,
      tier: "Essentials",
      originalPrice: 85.0,
      discounts: [
        { name: "Additional Line Promo", amount: -40.0, expiryDate: null },
        { name: "Employee Discount", amount: -20.0, expiryDate: null },
        { name: "Financing Program Promotion Credit", amount: -10.0, expiryDate: "2027-12-24", isFinancingPromotion: true },
        { name: "Automatic Payments Discount", amount: -5.0, expiryDate: null }
      ],
      planMonthly: 10.0,
      thisBillTotal: 84.76,
      oneTimeCharges: 18.0,
      deviceChargesBeforeTax: 44.0,
      deviceCharges: 54.56,
      priceBeforeTax: 10.0,
      priceAfterTax: 84.76,
      contractEnd: "Dec 2027",
      lineLabel: "HUP",
      addOn: "Device payment",
      discountSummary: "Employee Discount + Financing Program Promotion Credit",
      details: {
        financing: {
          deviceModel: "Demo Phone Pro 256GB",
          monthlyDevicePayment: 44.0,
          deviceTaxPayment: 5.72,
          currentFinancingBalance: 1120.0,
          deviceReturnDate: "2027-12-24",
          saveAndReturnAmount: 760.0
        },
        reviewNote: "This synthetic demo line has device payment and contract end. Keep it collapsed unless the agent clicks the number."
      }
    },
    {
      type: "Internet / bundle",
      account: "DEMO-BUNDLE-3310",
      sourcePage: 6,
      tier: "Gigabit bundle",
      originalPrice: 159.99,
      discounts: [
        { name: "Internet Offer - 24m", amount: -40.0, expiryDate: "2026-06-30" },
        { name: "Bundle Offer 24m Term", amount: -30.0, expiryDate: "2026-06-30" }
      ],
      planMonthly: 89.99,
      thisBillTotal: 111.0,
      oneTimeCharges: 0,
      deviceChargesBeforeTax: 0,
      deviceCharges: 0,
      priceBeforeTax: 89.99,
      priceAfterTax: 111.0,
      contractEnd: "2026-06-30",
      lineLabel: "Internet + TV",
      addOn: "Streaming add-on + Home Phone LD",
      discountSummary: "Internet Offer - 24m + Bundle Offer 24m Term",
      details: null
    }
  ],
  promoDetails: [
    {
      name: "Internet bundle discount ending",
      detail: "Synthetic bundle promos end on 2026-06-30. Verify in the official system before quoting.",
      status: "Verify"
    },
    {
      name: "HUP / device payment",
      detail: "Line 555-0187 has a device payment, financing promo credit, and later contract end.",
      status: "Needs review"
    },
    {
      name: "One-time / roaming driver",
      detail: "Line 555-0187 includes $18.00 before tax in one-time or roaming charges, separate from regular monthly cost.",
      status: "Explain"
    }
  ],
  notes: {
    quickFlags: [
      "Synthetic demo",
      "HUP",
      "Promo ending",
      "Roaming / one-time",
      "Verify"
    ],
    safety: "Demo data is synthetic. Do not quote a final retention offer until offer eligibility and discount end dates are verified in the official system."
  }
};
