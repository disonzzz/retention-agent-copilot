import { generateAssist } from "./domain/generateAssist.js";

const app = document.querySelector("#app");

if (!app) {
  throw new Error("App mount not found");
}

if (!window.__SAMPLE_ACCOUNT__) {
  throw new Error("Sample account data not found");
}

let data = window.__SAMPLE_ACCOUNT__;
let uploadStatus = "Ready to analyze a Rogers bill.";
let selectedLine = getInitialSelectedLine();
let customerStatement = "My bill went up and I want something cheaper.";
let assist = generateAssist(data, customerStatement);
let copyStatus = "Ready to generate and copy into Maestro notes.";
let audioFixtures = [];
let selectedAudioFixture = "";
let selectedAudioFile = null;
let selectedAudioRole = "caller";
let transcriptionResult = null;
let transcriptionStatus = "Choose a public sample or a local WAV file.";
let transcriptionRunning = false;
let uploadRequestId = 0;
let activeUploadController = null;

function getInitialSelectedLine() {
  const initialAccount = decodeURIComponent(window.location.hash.replace("#", ""));
  return data.services.find((service) => service.account === initialAccount && service.details) || null;
}

function formatMoney(value) {
  return typeof value === "number" ? `$${value.toFixed(2)}` : "Needs review";
}

function formatSignedMoney(value) {
  if (typeof value !== "number") return "Needs review";
  return value < 0 ? `-$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`;
}

function formatBillDate(value) {
  if (!value) return "Needs review";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toDisplayData(parsed) {
  const financingRecords = Array.isArray(parsed.financing) ? parsed.financing : [];
  const wirelessServices = parsed.wirelessLines.map((line) => {
    const hasFinancing = Boolean(line.financing || line.lineLabel === "HUP");
    const financing = hasFinancing
      ? financingRecords.find((record) => record.page === line.page || record.page === line.page + 1) || null
      : null;
    const savings = line.savings || [];

    return {
      type: line.type,
      account: line.account,
      tier: line.tier,
      originalPrice: line.basePlanCharge ?? null,
      sourcePage: line.page,
      discounts: line.discounts || [],
      planMonthly: line.totalMonthlyCharges ?? line.totalBeforeTax ?? 0,
      thisBillTotal: line.totalForWireless ?? line.totalAfterTax ?? line.totalBeforeTax ?? 0,
      oneTimeCharges: line.oneTimeChargesAndCredits ?? 0,
      deviceChargesBeforeTax: line.financing?.monthlyDevicePayment ?? 0,
      deviceCharges: line.additionalChargesAndCredits ?? 0,
      priceBeforeTax: line.totalBeforeTax ?? line.totalMonthlyCharges ?? 0,
      priceAfterTax: line.totalForWireless ?? line.totalAfterTax ?? line.totalBeforeTax ?? 0,
      contractEnd: line.contractEnd,
      lineLabel: hasFinancing ? "HUP" : line.lineLabel,
      addOn: line.financing ? "Device payment" : "No add-on visible",
      discountSummary: savings.map((saving) => saving.name).slice(0, 2).join(" + ") || "No discount visible",
      details:
        hasFinancing
          ? {
              financing: {
                deviceModel: financing?.deviceModel || "Device model needs review",
                monthlyDevicePayment: line.financing?.monthlyDevicePayment ?? 0,
                deviceTaxPayment: line.financing?.deviceTaxPayment ?? 0,
                currentFinancingBalance: line.financing?.currentFinancingBalance ?? financing?.currentFinancingBalance ?? null,
                deviceReturnDate: line.financing?.deviceReturnDate || financing?.deviceReturnDate || line.contractEnd,
                saveAndReturnAmount: financing?.saveAndReturnAmount ?? 0,
              },
              reviewNote: "This line has device payment or contract details. Verify before quoting final save options.",
            }
          : null,
    };
  });
  const bundleServices = (parsed.bundleServices || []).map((bundle) => ({
    type: "Internet / bundle",
    account: bundle.referenceNumber || bundle.account || bundle.serviceAddress || "Bundle",
    tier: bundle.tier,
    originalPrice: bundle.baseCharge ?? null,
    sourcePage: bundle.page,
    discounts: bundle.discounts || [],
    planMonthly: bundle.totalMonthlyCharges ?? bundle.totalBeforeTax ?? 0,
    thisBillTotal: bundle.totalForBundle ?? bundle.totalMonthlyCharges ?? 0,
    oneTimeCharges: 0,
    deviceChargesBeforeTax: 0,
    deviceCharges: 0,
    priceBeforeTax: bundle.totalBeforeTax ?? bundle.totalMonthlyCharges ?? 0,
    priceAfterTax: bundle.totalForBundle ?? bundle.totalBeforeTax ?? bundle.totalMonthlyCharges ?? 0,
    contractEnd: bundle.contractEnd || "n/a",
    lineLabel: bundle.bundleName || "Bundle",
    addOn: (bundle.addOns || []).map((addOn) => addOn.name).join(" + ") || "No add-on visible",
    discountSummary: (bundle.discounts || []).map((discount) => discount.name).slice(0, 2).join(" + ") || "No discount visible",
    details: null,
  }));
  const services = [...wirelessServices, ...bundleServices];

  const totalBeforeTax = services.reduce((sum, service) => sum + (service.priceBeforeTax || 0), 0);
  const driverService = services.find((service) => service.oneTimeCharges > 0 || service.deviceChargesBeforeTax > 0);
  const driverParts = driverService
    ? [
        `current recurring plan ${formatMoney(driverService.planMonthly ?? driverService.priceBeforeTax)} before tax`,
        driverService.oneTimeCharges > 0 ? `one-time or roaming ${formatMoney(driverService.oneTimeCharges)} before tax` : "",
        driverService.deviceChargesBeforeTax > 0 ? `device payment ${formatMoney(driverService.deviceChargesBeforeTax)} before tax` : "",
      ].filter(Boolean)
    : [];

  return {
    account: {
      ...data.account,
      accountIdMasked: parsed.account.accountIdMasked || "Needs review",
      billNumber: parsed.account.billNumber || "Needs review",
      billDate: formatBillDate(parsed.account.billDate),
      totalDueBeforeTax: totalBeforeTax,
      totalDue: parsed.account.totalDue ?? totalBeforeTax,
      estimatedNextBill: parsed.account.totalDue ?? data.account.estimatedNextBill,
      missingFields: parsed.warnings,
    },
    summaryCards: [
      {
        label: "Bill change explanation",
        value: driverService ? "Extra charges found" : "No extra charge visible",
        note: driverService
          ? `${driverService.account}: ${driverParts.join("; ")}.`
          : "Compare latest bill with previous bill before quoting.",
      },
      { label: "Total due", value: formatMoney(parsed.account.totalDue), note: "From uploaded bill." },
      { label: "Estimated next bill", value: formatMoney(parsed.account.totalDue), note: "Before new retention offer." },
      {
        label: "Change flags",
        value: services.some((service) => service.details)
          ? "HUP / device return"
          : bundleServices.length
            ? "Bundle / internet review"
            : "Promo / price review",
        note: "Verify offer eligibility in official system.",
      },
    ],
    services,
    promoDetails: [
      ...bundleServices.map((service) => ({
        name: "Internet / bundle service detected",
        detail: `${service.lineLabel}: ${formatMoney(service.planMonthly)} before tax. Contract / promo end: ${service.contractEnd}.`,
        status: "Verify",
      })),
      {
        name: services.some((service) => service.details) ? "HUP / device payment detected" : "Bill uploaded",
        detail: services.find((service) => service.details)
          ? `${services.find((service) => service.details).details.financing.deviceModel} with Save & Return ${formatMoney(services.find((service) => service.details).details.financing.saveAndReturnAmount)}.`
          : "No device financing found in visible parsed pages.",
        status: services.some((service) => service.details) ? "Needs review" : "Verify",
      },
    ],
    notes: {
      quickFlags: services.some((service) => service.details) ? ["HUP", "Device pay", "Return date", "Verify"] : ["Uploaded", "Review", "Quote later"],
      safety: data.notes.safety,
    },
  };
}

function renderSelectedLineDetails() {
  if (!selectedLine || !selectedLine.details) {
    return "";
  }

  const financing = selectedLine.details.financing;

  return `
    <section class="line-detail" aria-live="polite">
      <div class="line-detail-head">
        <div>
          <p class="eyebrow">Selected number</p>
          <h1>${escapeHtml(selectedLine.account)}</h1>
          <p>${escapeHtml(selectedLine.details.reviewNote)}</p>
        </div>
        <span class="detail-pill">Contract active</span>
      </div>

      <div class="detail-grid compact">
        <div class="detail-card">
          <p class="eyebrow">Financing</p>
          <h1>${escapeHtml(financing.deviceModel)}</h1>
          <p>Monthly device payment: ${formatMoney(financing.monthlyDevicePayment)}</p>
          <p>Device tax payment: ${formatMoney(financing.deviceTaxPayment)}</p>
          <p>Current financing balance: ${formatMoney(financing.currentFinancingBalance)}</p>
        </div>
        <div class="detail-card">
          <p class="eyebrow">Return / save & return</p>
          <h1>${formatMoney(financing.saveAndReturnAmount)}</h1>
          <p>Device return date: ${escapeHtml(financing.deviceReturnDate)}</p>
          <p>This must be verified before quoting final save options.</p>
        </div>
      </div>
    </section>
  `;
}

function renderDiscountBox(service) {
  const discounts = service.discounts || [];
  return `
    <div class="discount-box">
      <div class="discount-original">
        <span>Original price</span>
        <strong>${formatMoney(service.originalPrice)}</strong>
      </div>
      ${
        discounts.length
          ? `<ul>${discounts
              .map(
                (discount) => `
                  <li class="${discount.isFinancingPromotion ? "is-financing-promo" : ""}">
                    <span>${escapeHtml(discount.name)}</span>
                    <strong>${formatSignedMoney(discount.amount)}</strong>
                    ${discount.expiryDate ? `<small>Expires ${escapeHtml(discount.expiryDate)}</small>` : ""}
                  </li>
                `
              )
              .join("")}</ul>`
          : `<span class="cell-note">No discount visible</span>`
      }
    </div>
  `;
}

function renderAgentAssist() {
  return `
    <aside class="assist-column" aria-labelledby="assist-title">
      <section class="assist-panel transcript-panel">
        <div class="panel-head assist-head">
          <div>
            <p class="eyebrow">Care East call flow</p>
            <strong id="assist-title">Live Agent Assist</strong>
          </div>
          <div class="stage-display">
            <span>Current stage</span>
            <strong id="assist-stage">${escapeHtml(assist.stage)}</strong>
          </div>
        </div>

        <div class="transcript-line customer-line">
          <span>Customer transcript</span>
          <p id="customer-transcript">${escapeHtml(customerStatement)}</p>
        </div>
        <label class="transcript-composer" for="transcript-input">
          <span>Live transcript input</span>
          <textarea id="transcript-input" rows="3">${escapeHtml(customerStatement)}</textarea>
        </label>
        <p class="input-help">Suggestions update as the transcript changes. This demo does not record audio.</p>
      </section>

      <section class="assist-panel guidance-panel" aria-live="polite">
        <div class="guidance-head">
          <div>
            <p class="eyebrow">Recommended talk track</p>
            <strong>Response and note</strong>
          </div>
          <button class="summary-button compact-summary" id="generate-summary" type="button">Generate Summary</button>
        </div>

        <div class="assist-block response-block">
          <span>Suggested response</span>
          <p id="assist-response">${escapeHtml(assist.suggestedResponse)}</p>
        </div>
        <div class="assist-block prompt-block">
          <span>Follow-up question</span>
          <p id="assist-follow-up">${escapeHtml(assist.followUpQuestion)}</p>
        </div>
        <div class="understood-block">
          <strong>What AI understood</strong>
          <ul id="assist-understood">${assist.aiUnderstood.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>

        <div class="note-preview">
          <div class="note-preview-head">
            <div>
              <p class="eyebrow">End-of-call summary</p>
              <strong>Maestro note preview</strong>
            </div>
            <button class="secondary-button" id="copy-note" type="button">Copy note</button>
          </div>
          <pre id="maestro-note">${escapeHtml(assist.maestroNote)}</pre>
          <p id="copy-status">${escapeHtml(copyStatus)}</p>
        </div>

        <div class="assist-safety">
          <strong>Safety note</strong>
          <span id="assist-safety">${escapeHtml(assist.safetyNote)}</span>
        </div>
      </section>
    </aside>
  `;
}

function formatWer(evaluation) {
  return evaluation && typeof evaluation.wer === "number"
    ? `${(evaluation.wer * 100).toFixed(1)}%`
    : "Not evaluated";
}

function renderAudioTranscription() {
  const overall = transcriptionResult?.evaluation?.overall || null;
  const agentEvaluation = transcriptionResult?.evaluation?.roles?.agent || null;
  const callerEvaluation = transcriptionResult?.evaluation?.roles?.caller || null;
  const agentText = transcriptionResult?.transcripts?.agent?.text ||
    (transcriptionResult?.role === "agent" ? transcriptionResult.text : "");
  const callerText = transcriptionResult?.transcripts?.caller?.text ||
    (transcriptionResult?.role === "caller" ? transcriptionResult.text : "");
  const criticalErrors = overall?.criticalMeaningErrors || [];
  const canUseTranscription = Boolean(callerText && criticalErrors.length === 0 && !transcriptionRunning);

  return `
    <section class="panel audio-transcription" aria-labelledby="audio-title">
      <div class="panel-head audio-head">
        <div>
          <p class="eyebrow">Local workflow</p>
          <strong id="audio-title">Audio transcription</strong>
        </div>
        <span>localhost only</span>
      </div>
      <div class="audio-controls">
        <label>
          <span>Public test call</span>
          <select id="audio-fixture" ${transcriptionRunning ? "disabled" : ""}>
            <option value="">Choose a sample</option>
            ${audioFixtures.map((fixture) => `<option value="${escapeHtml(fixture.id)}" ${fixture.id === selectedAudioFixture ? "selected" : ""}>${escapeHtml(fixture.scenario)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Local WAV</span>
          <input id="audio-upload" type="file" accept=".wav,audio/wav" ${transcriptionRunning ? "disabled" : ""}>
        </label>
        <label>
          <span>Speaker role</span>
          <select id="audio-role" ${transcriptionRunning ? "disabled" : ""}>
            <option value="caller" ${selectedAudioRole === "caller" ? "selected" : ""}>Caller</option>
            <option value="agent" ${selectedAudioRole === "agent" ? "selected" : ""}>Agent</option>
          </select>
        </label>
        <button class="audio-run" id="run-transcription" type="button" ${transcriptionRunning || (!selectedAudioFixture && !selectedAudioFile) ? "disabled" : ""}>
          ${transcriptionRunning ? "Transcribing..." : "Run local transcription"}
        </button>
      </div>
      <p class="audio-status" id="transcription-status" role="status" aria-live="polite">${escapeHtml(transcriptionStatus)}</p>
      <div class="audio-metrics" aria-label="Transcription metrics">
        <div><span>Overall WER</span><strong id="overall-wer">${formatWer(overall)}</strong></div>
        <div><span>Agent WER</span><strong id="agent-wer">${formatWer(agentEvaluation)}</strong></div>
        <div><span>Caller WER</span><strong id="caller-wer">${formatWer(callerEvaluation)}</strong></div>
      </div>
      ${criticalErrors.length ? `<p class="audio-warning">Critical meaning check: ${criticalErrors.length} item(s) need review before use.</p>` : ""}
      <div class="audio-transcripts">
        <div><span>Agent transcript</span><p id="agent-audio-transcript">${escapeHtml(agentText || "No agent transcript available.")}</p></div>
        <div><span>Caller transcript</span><p id="caller-audio-transcript">${escapeHtml(callerText || "No caller transcript available.")}</p></div>
      </div>
      <button class="secondary-button audio-handoff" id="use-in-agent-assist" type="button" ${canUseTranscription ? "" : "disabled"}>Use in Agent Assist</button>
    </section>
  `;
}

function render() {
  const cards = data.summaryCards
    .map(
      (card) => `
        <div class="summary-card">
          <p class="eyebrow">${escapeHtml(card.label)}</p>
          <h1>${escapeHtml(card.value)}</h1>
          <p>${escapeHtml(card.note)}</p>
        </div>
      `
    )
    .join("");

  const services = data.services
    .map(
      (service) => `
        <tr>
          <td>
            <button class="line-button ${selectedLine && selectedLine.account === service.account ? "is-active" : ""}" data-account="${escapeHtml(service.account)}">
              ${escapeHtml(service.type)}<br><strong>${escapeHtml(service.account)}</strong>
              ${service.sourcePage ? `<span class="cell-note">Source: page ${escapeHtml(service.sourcePage)}</span>` : ""}
            </button>
          </td>
          <td>${escapeHtml(service.tier)}<span class="cell-note">${escapeHtml(service.lineLabel)}</span></td>
          <td>
            <span class="price-stack">
              <span class="original-price">Original ${formatMoney(service.originalPrice)}</span>
              <strong>${formatMoney(service.planMonthly ?? service.priceBeforeTax)}</strong>
              <span class="cell-note">Current before tax</span>
            </span>
          </td>
          <td><strong>${formatMoney(service.thisBillTotal ?? service.priceAfterTax)}</strong></td>
          <td class="bill-driver-cell compact-driver">
            ${service.oneTimeCharges > 0 ? `<span><strong>Roaming / one-time:</strong> ${formatMoney(service.oneTimeCharges)}</span>` : ""}
            ${service.deviceChargesBeforeTax > 0 ? `<span><strong>Device:</strong> ${formatMoney(service.deviceChargesBeforeTax)}<small class="driver-tax-note">Before tax</small></span>` : ""}
            ${service.oneTimeCharges <= 0 && service.deviceCharges <= 0 ? `<span class="cell-note">No extra charge</span>` : ""}
          </td>
          <td>${escapeHtml(service.contractEnd)}</td>
        </tr>
      `
    )
    .join("");

  const discountDetails = data.services
    .map(
      (service) => `
        <tr>
          <td>
            <button class="line-button ${selectedLine && selectedLine.account === service.account ? "is-active" : ""}" data-account="${escapeHtml(service.account)}">
              ${escapeHtml(service.type)}<br><strong>${escapeHtml(service.account)}</strong>
            </button>
          </td>
          <td>${escapeHtml(service.tier)}</td>
          <td>${escapeHtml(service.lineLabel)}</td>
          <td>${renderDiscountBox(service)}</td>
          <td>
            <strong>${formatMoney(service.planMonthly ?? service.priceBeforeTax)}</strong>
            <span class="cell-note">Before tax</span>
          </td>
          <td><strong>${formatMoney(service.thisBillTotal ?? service.priceAfterTax)}</strong></td>
          <td class="bill-driver-cell">
            ${service.oneTimeCharges > 0 ? `<span><strong>Roaming / one-time:</strong> ${formatMoney(service.oneTimeCharges)}</span>` : ""}
            ${service.deviceChargesBeforeTax > 0 ? `<span><strong>Device charges:</strong> ${formatMoney(service.deviceChargesBeforeTax)}<small class="driver-tax-note">Before tax · Including tax: ${formatMoney(service.deviceCharges)}</small></span>` : ""}
            ${service.oneTimeCharges <= 0 && service.deviceCharges <= 0 ? `<span class="cell-note">No extra charges visible</span>` : ""}
          </td>
          <td>${escapeHtml(service.contractEnd)}</td>
        </tr>
      `
    )
    .join("");

  const quickFlags = data.notes.quickFlags.map((flag) => `<span class="flag-chip">${escapeHtml(flag)}</span>`).join("");

  const promoDetails = data.promoDetails
    .map(
      (promo) => `
        <tr>
          <td><strong>${escapeHtml(promo.name)}</strong></td>
          <td>${escapeHtml(promo.detail)}</td>
          <td>${escapeHtml(promo.status)}</td>
        </tr>
      `
    )
    .join("");

  app.innerHTML = `
    <section class="topbar">
      <div class="brand">
        <div class="brand-mark">R</div>
        <strong>Retention Agent Copilot</strong>
      </div>
      <span class="status">Demo data only - verify offers in official system</span>
    </section>

    <section class="dashboard operator-workspace">
      <div class="bill-column">
        <section class="upload-panel">
          <div>
            <p class="eyebrow">Bill input</p>
            <h1>Upload bill PDF or extracted text</h1>
            <p id="upload-status" role="status" aria-live="polite">${escapeHtml(uploadStatus)}</p>
          </div>
          <label class="upload-button" for="bill-upload" role="button" tabindex="0">Upload PDF</label>
          <input id="bill-upload" type="file" accept=".pdf,.txt,text/plain,application/pdf" tabindex="-1">
        </section>

        <div class="summary-grid">${cards}</div>

        <section class="panel bill-workbench">
        <div class="panel-head">
          <strong>Bill breakdown</strong>
          <span>Sample Rogers bill</span>
        </div>

        <div class="data-row">
          <span class="label">Account number</span>
          <strong>${escapeHtml(data.account.accountIdMasked)}</strong>
        </div>
        <div class="data-row">
          <span class="label">Bill number</span>
          <strong>${escapeHtml(data.account.billNumber)}</strong>
        </div>
        <div class="data-row">
          <span class="label">Bill date</span>
          <strong>${escapeHtml(data.account.billDate)}</strong>
        </div>
        <div class="data-row">
          <span class="label">Bill period</span>
          <strong>${escapeHtml(data.account.billPeriod)}</strong>
        </div>
        <div class="data-row">
          <span class="label">Promo ends</span>
          <strong>${escapeHtml(data.account.promoEnds)}</strong>
        </div>

        <div class="table-scroll" tabindex="0" role="region" aria-label="Bill breakdown table"><table class="services-table compact-services">
          <thead>
            <tr>
              <th>Service</th>
              <th>Tier / label</th>
              <th>Plan monthly</th>
              <th>This bill total</th>
              <th>Bill drivers</th>
              <th>Contract end</th>
            </tr>
          </thead>
          <tbody>${services}</tbody>
        </table></div>

        <details class="charge-detail-drawer">
          <summary>Line-level discount detail</summary>
          <div class="table-scroll" tabindex="0" role="region" aria-label="Line-level discount detail table"><table class="services-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Tier</th>
                <th>Label</th>
                <th>Discounts</th>
                <th>Plan monthly</th>
                <th>This bill total</th>
                <th>Bill drivers</th>
                <th>Contract end</th>
              </tr>
            </thead>
            <tbody>${discountDetails}</tbody>
          </table></div>
        </details>

        <div class="table-scroll" tabindex="0" role="region" aria-label="Promotion review table"><table class="services-table detail-table">
          <thead>
            <tr>
              <th>Promotion / review item</th>
              <th>Detail</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${promoDetails}</tbody>
        </table></div>

        <div id="line-detail-slot">${renderSelectedLineDetails()}</div>

        <div class="flag-box">
          <strong>Quick flags</strong>
          <div class="flag-list">${quickFlags}</div>
        </div>

        <div class="note-box">
          <strong>Safety note</strong>
          <p>${escapeHtml(data.notes.safety)}</p>
        </div>
        </section>

        ${renderAudioTranscription()}
      </div>
      ${renderAgentAssist()}
    </section>
  `;
}

function updateAssistFromTranscript(value) {
  customerStatement = value.trim() || "Customer statement not yet captured.";
  assist = generateAssist(data, customerStatement);

  const updates = {
    "assist-stage": assist.stage,
    "customer-transcript": customerStatement,
    "assist-response": assist.suggestedResponse,
    "assist-follow-up": assist.followUpQuestion,
    "maestro-note": assist.maestroNote,
    "assist-safety": assist.safetyNote,
  };

  Object.entries(updates).forEach(([id, text]) => {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = text;
  });

  const understood = document.querySelector("#assist-understood");
  if (understood) {
    understood.innerHTML = assist.aiUnderstood.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }
}

async function copyMaestroNote() {
  const text = assist.maestroNote;
  try {
    await navigator.clipboard.writeText(text);
    copyStatus = "Summary generated and copied. Ready to paste into Maestro notes.";
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    copyStatus = copied
      ? "Summary generated and copied. Ready to paste into Maestro notes."
      : "Summary generated. Use Copy note to try again.";
  }

  const status = document.querySelector("#copy-status");
  if (status) status.textContent = copyStatus;
}

function analyzeUploadedBill(text, fileName = "uploaded bill") {
  if (typeof window.parseRogersBillText !== "function") {
    uploadStatus = "Parser is not ready. Please reload and try again.";
    render();
    return;
  }

  const parsed = window.parseRogersBillText(text);
  data = toDisplayData(parsed);
  selectedLine = data.services.find((service) => service.details) || null;
  window.location.hash = selectedLine ? selectedLine.account : "";
  uploadStatus = `Upload complete: ${fileName}. ${data.services.length} wireless line(s) detected.`;
  assist = generateAssist(data, customerStatement);
  render();
}

async function analyzeUploadedPdf(file, requestId = ++uploadRequestId, controller = new AbortController()) {
  const formData = new FormData();
  formData.append("bill", file);

  const response = await fetch("/api/analyze-pdf", {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error("PDF analysis failed");
  }

  const parsed = await response.json();
  if (requestId !== uploadRequestId) return;
  data = toDisplayData(parsed);
  selectedLine = data.services.find((service) => service.details) || null;
  window.location.hash = selectedLine ? selectedLine.account : "";
  uploadStatus = `Upload complete: ${file.name}. ${data.services.length} wireless line(s) detected.`;
  assist = generateAssist(data, customerStatement);
  render();
}

async function loadAudioFixtures() {
  try {
    const response = await fetch("/api/audio-fixtures");
    if (!response.ok) throw new Error("Fixture list unavailable");
    const payload = await response.json();
    audioFixtures = Array.isArray(payload.calls) ? payload.calls : [];
    transcriptionStatus = audioFixtures.length
      ? "Public test calls are ready. Audio stays on this localhost server."
      : "No public test calls are available.";
  } catch {
    transcriptionStatus = "Audio tools need the local server.";
  }
  render();
}

async function runLocalTranscription() {
  transcriptionRunning = true;
  transcriptionResult = null;
  transcriptionStatus = "Transcribing locally...";
  render();
  try {
    let response;
    if (selectedAudioFile) {
      const form = new FormData();
      form.append("audio", selectedAudioFile);
      form.append("role", selectedAudioRole);
      response = await fetch("/api/transcribe-audio", { method: "POST", body: form });
    } else {
      response = await fetch("/api/transcribe-fixture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId: selectedAudioFixture }),
      });
    }
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Transcription failed");
    transcriptionResult = payload;
    transcriptionStatus = `Transcription complete (${payload.engine}).`;
  } catch (error) {
    transcriptionResult = null;
    transcriptionStatus = error instanceof Error ? error.message : "Transcription failed";
  } finally {
    transcriptionRunning = false;
    render();
  }
}

function useTranscriptionInAgentAssist() {
  const callerText = transcriptionResult?.transcripts?.caller?.text ||
    (transcriptionResult?.role === "caller" ? transcriptionResult.text : "");
  const criticalErrors = transcriptionResult?.evaluation?.overall?.criticalMeaningErrors || [];
  const nextStatement = callerText.trim();
  if (criticalErrors.length > 0) return;
  if (!nextStatement) return;
  customerStatement = nextStatement;
  assist = generateAssist(data, customerStatement);
  copyStatus = "Transcription added. Review before generating the Maestro note.";
  render();
  document.querySelector("#transcript-input")?.focus();
}

function readUploadedFile(file, requestId) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (requestId !== uploadRequestId) return;
    analyzeUploadedBill(String(reader.result || ""), file.name);
  });
  reader.addEventListener("error", () => {
    if (requestId !== uploadRequestId) return;
    uploadStatus = "File could not be read. Try the PDF text export or OCR result.";
    render();
  });
  reader.readAsText(file);
}

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === "audio-fixture") {
    selectedAudioFixture = target.value;
    selectedAudioFile = null;
    transcriptionResult = null;
    transcriptionStatus = selectedAudioFixture ? "Sample selected. Ready to transcribe locally." : "Choose a public sample or a local WAV file.";
    render();
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "audio-role") {
    selectedAudioRole = target.value;
    return;
  }
  if (target instanceof HTMLInputElement && target.id === "audio-upload") {
    selectedAudioFile = target.files?.[0] || null;
    selectedAudioFixture = "";
    transcriptionResult = null;
    transcriptionStatus = selectedAudioFile ? `${selectedAudioFile.name} selected. Ready to transcribe locally.` : "Choose a public sample or a local WAV file.";
    render();
    return;
  }
  if (!(target instanceof HTMLInputElement) || target.id !== "bill-upload") {
    return;
  }

  const file = target.files?.[0];
  if (!file) {
    return;
  }

  const requestId = ++uploadRequestId;
  activeUploadController?.abort();
  activeUploadController = null;
  uploadStatus = `Analyzing ${file.name}...`;
  render();
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const controller = new AbortController();
    activeUploadController = controller;
    analyzeUploadedPdf(file, requestId, controller).catch((error) => {
      if (requestId !== uploadRequestId || error?.name === "AbortError") return;
      uploadStatus = "PDF analysis needs the local server. Start it with: python scripts/server.py";
      render();
    });
    return;
  }

  readUploadedFile(file, requestId);
});

app.addEventListener("keydown", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.matches(".upload-button")) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  document.querySelector("#bill-upload")?.click();
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement && target.id === "transcript-input") {
    updateAssistFromTranscript(target.value);
  }
});

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.closest("#generate-summary")) {
    updateAssistFromTranscript(document.querySelector("#transcript-input")?.value || customerStatement);
    copyMaestroNote();
    return;
  }

  if (target.closest("#copy-note")) {
    copyMaestroNote();
    return;
  }

  if (target.closest("#run-transcription")) {
    runLocalTranscription();
    return;
  }

  if (target.closest("#use-in-agent-assist")) {
    useTranscriptionInAgentAssist();
    return;
  }

  const button = target.closest(".line-button");
  if (!button) {
    return;
  }

  const account = button.getAttribute("data-account");
  const nextSelected = data.services.find((service) => service.account === account) || null;
  selectedLine = nextSelected && nextSelected.details ? nextSelected : null;
  window.location.hash = selectedLine ? selectedLine.account : "";
  render();
});

window.analyzeUploadedBill = analyzeUploadedBill;
window.analyzeUploadedPdf = analyzeUploadedPdf;
render();
loadAudioFixtures();
