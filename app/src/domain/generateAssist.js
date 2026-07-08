function money(value) {
  return typeof value === "number" ? `$${value.toFixed(2)}` : "not confirmed";
}

function getStatement(transcript) {
  if (Array.isArray(transcript)) {
    return transcript.map((item) => (typeof item === "string" ? item : item?.text || "")).join(" ").trim();
  }
  return String(transcript || "").trim();
}

function getStage(statement) {
  const lower = statement.toLowerCase();
  if (/\b(cancel|leave|leaving|port|switch provider|disconnect)\b/.test(lower)) {
    return "Critical retention";
  }
  if (/\b(accept|agreed|confirmed|go ahead|completed)\b/.test(lower)) {
    return "Conclude";
  }
  if (/\b(option|offer|solution|next step|what can you do|lower my monthly|lower the monthly|after explaining)\b/.test(lower)) {
    return "Resolve and Insulate";
  }
  return "Discover";
}

function getDriverLine(data) {
  return (data?.services || []).find(
    (service) => (service.oneTimeCharges || 0) > 0 || (service.deviceChargesBeforeTax || 0) > 0
  );
}

function getConcernProfile(statement) {
  const lower = statement.toLowerCase();
  if (/\b(roaming|travel|long distance|one[- ]time charge)\b/.test(lower)) {
    return {
      label: "roaming or one-time charge",
      response: "I understand the roaming or one-time charge was unexpected. I can review the bill evidence for that charge and explain what changed before we check verified next steps.",
      followUp: "Was the roaming usage expected, or is the charge itself what you want reviewed?",
    };
  }
  if (/\b(device|phone|financ|return date|save\s*&\s*return|contract)\b/.test(lower)) {
    return {
      label: "device payment or return terms",
      response: "I understand the device payment or return terms are the concern. Let me separate those bill details from the recurring plan before we review verified next steps.",
      followUp: "Is your priority the monthly device payment, the return date, or understanding the remaining device balance?",
    };
  }
  if (/\b(promo|promotion|discount|credit|expiry|expires|expired)\b/.test(lower)) {
    return {
      label: "promotion or discount",
      response: "I understand the promotion or discount is the concern. Let me confirm what the bill actually shows before we review any verified options.",
      followUp: "Are you asking about a discount that changed, one that may expire, or a credit you expected to see?",
    };
  }
  return {
    label: "higher bill and monthly cost",
    response: "I understand the bill went up. Let me break down what changed first, then check which verified options may help lower the monthly cost.",
    followUp: "Is your main goal to lower the monthly total, or are you also open to changing lines, internet, or bundle services?",
  };
}

export function generateAssist(data, transcript) {
  const statement = getStatement(transcript);
  const stage = getStage(statement);
  const driverLine = getDriverLine(data);
  const concern = stage === "Critical retention" ? "Cancellation risk" : "Bill increased";
  const concernProfile = getConcernProfile(statement);

  const suggestedResponse =
    stage === "Critical retention"
      ? `I understand you are considering leaving because of the ${concernProfile.label}. Let me break down what the bill shows first, then I can check verified options that fit your priorities.`
      : stage === "Resolve and Insulate"
        ? `Based on what we reviewed, I can look for a verified option that addresses the ${concernProfile.label}. I will confirm the final price and eligibility before quoting it.`
      : stage === "Conclude"
        ? "Let me summarize what we reviewed, what changed on the bill, and the next verified step so everything is clear before we finish."
      : concernProfile.response;

  const driverFacts = driverLine
    ? [
        `Line ${driverLine.account} has a ${money(driverLine.planMonthly)} recurring plan before tax.`,
        ...(driverLine.oneTimeCharges > 0
          ? [`This bill also includes ${money(driverLine.oneTimeCharges)} roaming or one-time charges.`]
          : []),
        ...(driverLine.deviceChargesBeforeTax > 0
          ? [`This bill also includes a ${money(driverLine.deviceChargesBeforeTax)} device charge before tax.`]
          : []),
      ]
    : ["No separate one-time or device charge was confirmed in the visible bill data."];

  const beforeState = driverLine
    ? `Line ${driverLine.account}: recurring plan ${money(driverLine.planMonthly)} before tax; current bill total ${money(driverLine.thisBillTotal)}.`
    : `Account total shown: ${money(data?.account?.totalDue)}.`;

  return {
    stage,
    concern,
    suggestedResponse,
    followUpQuestion:
      stage === "Critical retention"
        ? `Before you decide, what would need to be resolved about the ${concernProfile.label}?`
        : stage === "Resolve and Insulate"
          ? "Can I confirm that this option should focus on lowering the monthly cost before changing any services?"
        : stage === "Conclude"
          ? "Is there anything else about the bill or next step you want me to recap?"
        : concernProfile.followUp,
    aiUnderstood: [
      "Customer is concerned about the higher bill and wants a lower monthly cost.",
      ...driverFacts,
      "Final pricing and offer eligibility still require official-system verification.",
    ],
    safetyNote:
      "Verify offer eligibility, discount expiry dates, taxes, and final pricing in the official system before quoting.",
    maestroNote: [
      `Stage: ${stage}`,
      `Reason: Customer stated: ${statement || "No caller statement captured."}`,
      `Customer priority: ${concernProfile.label}.`,
      `Before: ${beforeState}`,
      "Bill facts reviewed: Recurring plan, visible discounts, roaming/one-time charges, device payment, and contract details.",
      "Reviewed: Recurring plan, visible discounts, roaming/one-time charges, device payment, and contract details.",
      "After: No confirmed plan change or final price was completed in this demo.",
      "Next step: Verify eligible retention options and final pricing in the official system before quoting.",
    ].join("\n"),
  };
}
