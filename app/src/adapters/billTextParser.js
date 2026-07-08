(function (global) {
  function parseMoney(value) {
    if (typeof value !== "string") return null;
    const cleaned = value.replace(/[$,]/g, "").trim();
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : null;
  }

  function firstMatch(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  function normalizeMonthYear(raw) {
    if (!raw) return null;
    const match = raw.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
    if (!match) return raw.trim();
    return `${match[1].slice(0, 3)} ${match[3]}`;
  }

  function parsePages(text) {
    const pages = [];
    const pageRegex = /--- PAGE (\d+) ---\r?\n([\s\S]*?)(?=\r?\n--- PAGE \d+ ---\r?\n|$)/g;
    let match;
    while ((match = pageRegex.exec(text))) {
      pages.push({
        page: Number(match[1]),
        text: match[2].trim(),
      });
    }

    if (!pages.length) {
      pages.push({ page: 1, text: text.trim() });
    }

    return pages;
  }

  function parseAccount(pages) {
    const firstPage = pages.find((page) => page.page === 1) || pages[0] || { text: "" };
    const lines = firstPage.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

    let accountIdMasked = null;
    let billNumber = null;
    let billDate = null;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!accountIdMasked) {
        const accountMatch = line.match(/^(\d-\d{4}-\d{4})\b/);
        if (accountMatch) {
          accountIdMasked = accountMatch[1];
          billNumber = line.match(/^\d-\d{4}-\d{4}\s+(\d{7,})\b/)?.[1] || billNumber;
          billDate = line.match(/\b([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})\b/)?.[1] || billDate;
          continue;
        }
      }

      if (!billNumber) {
        billNumber = line.match(/\b(\d{7,})\b/)?.[1] || billNumber;
      }

      if (!billDate) {
        billDate = line.match(/\b([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})\b/)?.[1] || billDate;
      }
    }

    const totalDue = firstMatch(firstPage.text, [
      /Total amount due:\s*\$?([\d.,]+)/i,
      /Total to pay\s*\$?([\d.,]+)/i,
      /What is the total due\?\s*\$?([\d.,]+)/i,
    ]);

    const totalBeforeTax = firstMatch(firstPage.text, [/Total before taxes\s+([\d.,]+)/i]);

    return {
      accountIdMasked,
      billNumber,
      billDate,
      totalDue: parseMoney(totalDue),
      totalBeforeTax: parseMoney(totalBeforeTax),
    };
  }

  function inferTier(planName) {
    if (!planName) return "Unknown";
    if (/Essentials/i.test(planName)) return "Essentials";
    if (/Popular/i.test(planName)) return "Popular";
    if (/Ultimate/i.test(planName)) return "Ultimate";
    if (/Infinite/i.test(planName)) return "Popular";
    return "Unknown";
  }

  function parseSavings(pageText) {
    return pageText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(Savings|Credit):\s*(.+?)\s+(-[\d.,]+)(?:\s+.*)?$/i);
        if (!match) return null;
        const expiryMatch = match[2].match(
          /\b(?:ends?|expires?|expiry)\s*:?\s*([A-Za-z]{3}\s+\d{1,2}(?:\/\d{2}|,\s*\d{4}))/i
        );
        const name = expiryMatch
          ? match[2]
              .replace(/\s*-?\s*\b(?:ends?|expires?|expiry)\s*:?\s*[A-Za-z]{3}\s+\d{1,2}(?:\/\d{2}|,\s*\d{4})/i, "")
              .trim()
          : match[2].trim();
        return {
          kind: match[1].toLowerCase(),
          name,
          amount: parseMoney(match[3]),
          expiryDate: expiryMatch ? expiryMatch[1] : null,
          isFinancingPromotion: /Financing Program Promotion/i.test(name),
        };
      })
      .filter(Boolean);
  }

  function parseWirelessLine(page) {
    const header = page.text.match(/\bWireless\s+(\d{3}-\d{3}-\d{4})\b/i);
    if (!header || !/Monthly charges/i.test(page.text) || !/Total before taxes/i.test(page.text)) return null;

    const account = header[1];
    const lines = page.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const monthlyIndex = lines.findIndex((line) => line.startsWith("Monthly charges"));
    const planLine = monthlyIndex >= 0
      ? lines.slice(monthlyIndex + 1, monthlyIndex + 8).find(
          (line) => /\b(Essentials|Popular|Ultimate|Infinite)\b/i.test(line) && /\d+[\d,.]*$/.test(line)
        ) || ""
      : "";
    const planName = planLine.replace(/\s+\d+[\d,.]*$/, "").trim();
    const basePlanCharge = parseMoney(firstMatch(planLine, [/([\d,.]+)$/]));
    const totalMonthlyCharges = firstMatch(page.text, [/Total monthly charges\s+([\d.,]+)/i]);
    const oneTimeChargesAndCredits = firstMatch(page.text, [/Total one-time charges and credits\s+([\d.,]+)/i]);
    const totalBeforeTax = firstMatch(page.text, [/Total before taxes\s+([\d.,]+)/i]);
    const totalAfterTax = firstMatch(page.text, [/Total after taxes\s+([\d.,]+)/i]);
    const totalForWireless = firstMatch(page.text, [/Total for Wireless\s+\d{3}-\d{3}-\d{4}\s+\$?([\d.,]+)/i]);
    const savings = parseSavings(page.text);

    const financing = {};
    const monthlyDevicePayment = firstMatch(page.text, [/Financed:\s*Monthly Device Payment.*?\s([\d.,]+)$/im]);
    const monthlyDeviceTaxPayment = firstMatch(page.text, [/Financed:\s*Monthly Device Tax Payment.*?\s([\d.,]+)$/im]);
    const currentFinancingBalance = firstMatch(page.text, [/Current financing balance:\s*\$?([\d.,]+)/i]);

    if (monthlyDevicePayment || monthlyDeviceTaxPayment || currentFinancingBalance) {
      if (monthlyDevicePayment) financing.monthlyDevicePayment = parseMoney(monthlyDevicePayment);
      if (monthlyDeviceTaxPayment) financing.deviceTaxPayment = parseMoney(monthlyDeviceTaxPayment);
      if (currentFinancingBalance) financing.currentFinancingBalance = parseMoney(currentFinancingBalance);
    }

    const deviceReturnDate = firstMatch(page.text, [/return device by ([A-Za-z]+\s+\d{1,2},\s+\d{4})/i]);
    if (deviceReturnDate) {
      financing.deviceReturnDate = normalizeMonthYear(deviceReturnDate);
    }

    const contractEnd = firstMatch(page.text, [
      /Contract end:\s*([A-Za-z]{3}\s+\d{4})/i,
      /Contract end:\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i,
      /contract end:\s*([A-Za-z]{3}\s+\d{4})/i,
      /contract end:\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i,
    ]) || "n/a";

    return {
      page: page.page,
      type: "Wireless",
      account,
      tier: inferTier(planName),
      planName,
      basePlanCharge,
      lineLabel: /BYOD/i.test(page.text) ? "BYOD" : /HUP/i.test(page.text) ? "HUP" : "Plan",
      totalMonthlyCharges: parseMoney(totalMonthlyCharges),
      oneTimeChargesAndCredits: parseMoney(oneTimeChargesAndCredits),
      additionalChargesAndCredits: null,
      totalBeforeTax: parseMoney(totalBeforeTax),
      totalAfterTax: parseMoney(totalAfterTax),
      totalForWireless: parseMoney(totalForWireless),
      contractEnd: contractEnd === "n/a" ? "n/a" : normalizeMonthYear(contractEnd),
      savings,
      discounts: savings,
      financing: Object.keys(financing).length ? financing : null,
    };
  }

  function parseFinancing(page) {
    if (!/Financing Program Details/i.test(page.text)) return null;

    const deviceModel = firstMatch(page.text, [
      /^(IP[^\n]+?)\s+(?:Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov)\s+\d{1,2},\s+\d{4}/im,
      /^(.*COSMIC ORANGE)\s+(?:Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov)\s+\d{1,2},\s+\d{4}/im,
    ]);
    const saveAndReturnAmount = firstMatch(page.text, [/Save & Return Amount of \$?([\d.,]+)/i]);
    const deviceReturnDate = firstMatch(page.text, [
      /returned by ([A-Za-z]+\s+\d{1,2},\s+\d{4})/i,
      /return device by\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i,
      /return device by[\s\S]{0,80}?([A-Za-z]+\s+\d{1,2},\s+\d{4})/i,
    ]);
    const currentFinancingBalance = firstMatch(page.text, [/Current Financing Balance \(\$\)\s+([\d.,]+)/i]);

    return {
      page: page.page,
      deviceModel,
      currentFinancingBalance: parseMoney(currentFinancingBalance),
      saveAndReturnAmount: parseMoney(saveAndReturnAmount),
      deviceReturnDate: deviceReturnDate ? normalizeMonthYear(deviceReturnDate) : null,
    };
  }

  function parseBundleService(page) {
    if (!/Bundled Services/i.test(page.text) || !/Total for Bundled Services/i.test(page.text)) {
      return null;
    }

    const lines = page.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const headerIndex = lines.findIndex((line) => /Bundled Services/i.test(line));
    const customerLine = headerIndex >= 0 ? lines[headerIndex + 1] || "" : "";
    const addressMatch = customerLine.match(/^[^,]+,\s*(.+?)\s*\|\s*Reference\s*:?\s*(\d+)/i);
    const monthlyIndex = lines.findIndex((line) => line.startsWith("Monthly charges"));
    const totalMonthlyIndex = lines.findIndex((line) => /^Total monthly charges\b/i.test(line));

    const chargeLines = monthlyIndex >= 0 && totalMonthlyIndex > monthlyIndex
      ? lines.slice(monthlyIndex + 1, totalMonthlyIndex)
      : [];
    const baseLine = chargeLines.find((line) => !/^Includes:?$/i.test(line) && !/^Savings|^Credit/i.test(line) && /\d+[\d,.]*$/.test(line)) || "";
    const bundleName = baseLine.replace(/\s+\d+[\d,.]*$/, "").trim();
    const baseCharge = parseMoney(firstMatch(baseLine, [/([\d,.]+)$/]));

    const includes = [];
    const includesIndex = lines.findIndex((line) => /^Includes:?$/i.test(line));
    if (includesIndex >= 0) {
      for (const line of lines.slice(includesIndex + 1)) {
        if (/^(Savings|Credit):/i.test(line) || /^Total monthly charges\b/i.test(line)) break;
        if (!/\d+[\d,.]*$/.test(line)) includes.push(line);
      }
    }

    const addOns = chargeLines
      .filter((line) => {
        if (!/\d+[\d,.]*$/.test(line)) return false;
        if (line === baseLine) return false;
        if (/^(Savings|Credit):/i.test(line)) return false;
        return true;
      })
      .map((line) => ({
        name: line.replace(/\s+[\d,.]+$/, "").trim(),
        amount: parseMoney(firstMatch(line, [/([\d,.]+)$/])),
      }));

    const discounts = parseSavings(page.text);
    const usage = {};
    const internetUsage = firstMatch(page.text, [/Internet\s+Usage Included\s+([\d.,]+)\s+GB/i]);
    if (internetUsage) usage.internetGb = parseMoney(internetUsage);

    const contractEnd =
      discounts.find((discount) => discount.expiryDate)?.expiryDate ||
      firstMatch(page.text, [/ending on\s+([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i]) ||
      "n/a";

    return {
      page: page.page,
      type: "Bundle",
      account: addressMatch ? addressMatch[2] : null,
      serviceAddress: addressMatch ? addressMatch[1].trim() : null,
      referenceNumber: addressMatch ? addressMatch[2] : null,
      tier: inferTier(bundleName),
      bundleName,
      includes,
      baseCharge,
      discounts,
      addOns,
      totalMonthlyCharges: parseMoney(firstMatch(page.text, [/Total monthly charges\s+([\d.,]+)/i])),
      totalBeforeTax: parseMoney(firstMatch(page.text, [/Total before taxes\s+([\d.,]+)/i])),
      totalForBundle: parseMoney(firstMatch(page.text, [/Total for Bundled Services\s+\$?([\d.,]+)/i])),
      usage,
      contractEnd,
    };
  }

  function parseRogersBillText(text) {
    const pages = parsePages(text);
    const account = parseAccount(pages);
    const financing = pages.map(parseFinancing).filter(Boolean);
    const wirelessLines = pages.map(parseWirelessLine).filter(Boolean);
    const bundleServices = pages.map(parseBundleService).filter(Boolean);

    const continuationTotals = new Map();
    for (const page of pages) {
      const account = firstMatch(page.text, [/Total for Wireless\s+(\d{3}-\d{3}-\d{4})/i]);
      if (!account) continue;
      continuationTotals.set(account, {
        additionalChargesAndCredits: parseMoney(
          firstMatch(page.text, [/Total additional charges and credits\s+([\d.,]+)/i])
        ),
        totalForWireless: parseMoney(
          firstMatch(page.text, [/Total for Wireless\s+\d{3}-\d{3}-\d{4}\s+\$?([\d.,]+)/i])
        ),
      });
    }

    for (const line of wirelessLines) {
      const continuation = continuationTotals.get(line.account);
      if (!continuation) continue;
      if (continuation.additionalChargesAndCredits != null) {
        line.additionalChargesAndCredits = continuation.additionalChargesAndCredits;
      }
      if (continuation.totalForWireless != null) {
        line.totalForWireless = continuation.totalForWireless;
      }
    }

    const returnDate = financing[0]?.deviceReturnDate || null;
    if (returnDate) {
      for (const line of wirelessLines) {
        if (line.contractEnd === "n/a" && (line.lineLabel === "HUP" || line.financing)) {
          line.contractEnd = returnDate;
        }
      }
    }

    return {
      account,
      wirelessLines,
      bundleServices,
      financing,
      warnings: account.totalDue == null ? ["missing_total_due"] : [],
    };
  }

  global.parseRogersBillText = parseRogersBillText;
})(typeof window !== "undefined" ? window : globalThis);
