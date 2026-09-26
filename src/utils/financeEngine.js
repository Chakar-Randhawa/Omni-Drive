export const financeEngine = {
  // Loan EMI & Amortization
  calculateLoanEMI(principal, annualRatePercent, tenureYears) {
    const P = Number(principal);
    const r = (Number(annualRatePercent) / 12) / 100;
    const n = Number(tenureYears) * 12;

    if (P <= 0 || r <= 0 || n <= 0) {
      throw new Error('Principal, interest rate, and tenure must be positive numbers.');
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    const schedule = [];
    let balance = P;
    for (let month = 1; month <= Math.min(n, 120); month++) {
      const interestForMonth = balance * r;
      const principalForMonth = emi - interestForMonth;
      balance = Math.max(0, balance - principalForMonth);
      schedule.push({
        month,
        emi: Math.round(emi),
        principal: Math.round(principalForMonth),
        interest: Math.round(interestForMonth),
        balance: Math.round(balance)
      });
    }

    return {
      monthlyEMI: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      tenureMonths: n,
      schedule
    };
  },

  // Compound Interest Wealth Projection
  calculateCompoundInterest(principal, monthlyDeposit, annualRatePercent, years, compoundFrequency = 12) {
    const P = Number(principal);
    const PMT = Number(monthlyDeposit);
    const r = Number(annualRatePercent) / 100;
    const t = Number(years);
    const n = Number(compoundFrequency);

    let balance = P;
    const yearlyBreakdown = [];
    let totalDeposited = P;

    for (let y = 1; y <= t; y++) {
      for (let m = 1; m <= 12; m++) {
        balance += PMT;
        totalDeposited += PMT;
        balance += balance * (r / 12);
      }
      yearlyBreakdown.push({
        year: y,
        totalDeposited: Math.round(totalDeposited),
        totalInterest: Math.round(balance - totalDeposited),
        balance: Math.round(balance)
      });
    }

    return {
      endingBalance: Math.round(balance),
      totalDeposited: Math.round(totalDeposited),
      totalInterestEarned: Math.round(balance - totalDeposited),
      yearlyBreakdown
    };
  },

  // Crypto DCA Calculator
  calculateCryptoDCA(periodicInvestment, frequencyCount, avgBuyPrice, currentPrice) {
    const totalInvested = Number(periodicInvestment) * Number(frequencyCount);
    const unitsAccumulated = totalInvested / Number(avgBuyPrice);
    const currentValue = unitsAccumulated * Number(currentPrice);
    const profit = currentValue - totalInvested;
    const roiPercent = ((profit / totalInvested) * 100).toFixed(2);

    return {
      totalInvested: Math.round(totalInvested),
      unitsAccumulated: unitsAccumulated.toFixed(6),
      currentValue: Math.round(currentValue),
      profit: Math.round(profit),
      roiPercent
    };
  },

  // SaaS MRR & Churn Calculator
  calculateSaaSMetrics(currentCustomers, arpu, newCustomersPerMonth, monthlyChurnPercent) {
    const cust = Number(currentCustomers);
    const revPerUser = Number(arpu);
    const newCust = Number(newCustomersPerMonth);
    const churnRate = Number(monthlyChurnPercent) / 100;

    const currentMRR = cust * revPerUser;
    const currentARR = currentMRR * 12;
    const lostCustomersPerMonth = Math.round(cust * churnRate);
    const netCustomerChange = newCust - lostCustomersPerMonth;
    const projectedMRRNextMonth = (cust + netCustomerChange) * revPerUser;
    const customerLifetimeMonths = churnRate > 0 ? (1 / churnRate).toFixed(1) : 'Infinite';
    const ltv = churnRate > 0 ? Math.round(revPerUser / churnRate) : 'N/A';

    return {
      currentMRR: Math.round(currentMRR),
      currentARR: Math.round(currentARR),
      lostCustomersPerMonth,
      netCustomerChange,
      projectedMRRNextMonth: Math.round(projectedMRRNextMonth),
      customerLifetimeMonths,
      ltv
    };
  },

  // Freelance Hourly Rate Calculator
  calculateFreelanceRate(targetAnnualIncome, annualBusinessExpenses, billableHoursPerWeek, vacationWeeks = 4, taxRatePercent = 25) {
    const netIncome = Number(targetAnnualIncome);
    const expenses = Number(annualBusinessExpenses);
    const taxRate = Number(taxRatePercent) / 100;
    const weeksWorked = 52 - Number(vacationWeeks);
    const totalBillableHours = weeksWorked * Number(billableHoursPerWeek);

    // Gross needed: (NetIncome + Expenses) / (1 - taxRate)
    const grossNeeded = (netIncome + expenses) / (1 - taxRate);
    const hourlyRate = grossNeeded / totalBillableHours;

    return {
      recommendedHourlyRate: Math.ceil(hourlyRate),
      totalBillableHoursPerYear: totalBillableHours,
      grossRevenueRequired: Math.round(grossNeeded),
      estimatedTaxes: Math.round(grossNeeded * taxRate)
    };
  },

  // E-Commerce Margin & ROI
  calculateEcomMargin(sellingPrice, cogs, shippingCost, marketplaceFeePercent = 15, adSpendPerUnit = 0) {
    const price = Number(sellingPrice);
    const cost = Number(cogs);
    const shipping = Number(shippingCost);
    const fee = price * (Number(marketplaceFeePercent) / 100);
    const ads = Number(adSpendPerUnit);

    const totalCost = cost + shipping + fee + ads;
    const netProfit = price - totalCost;
    const netMarginPercent = ((netProfit / price) * 100).toFixed(1);
    const roasBreakEven = ads > 0 ? (price / ads).toFixed(2) : 'N/A';

    return {
      netProfit: netProfit.toFixed(2),
      netMarginPercent,
      marketplaceFee: fee.toFixed(2),
      totalCostPerUnit: totalCost.toFixed(2),
      roasBreakEven
    };
  },

  // Global Sales Tax & VAT Calculator
  calculateVAT(amount, ratePercent, isTaxInclusive = false) {
    const val = Number(amount);
    const rate = Number(ratePercent) / 100;

    let netAmount, taxAmount, totalAmount;
    if (isTaxInclusive) {
      netAmount = val / (1 + rate);
      taxAmount = val - netAmount;
      totalAmount = val;
    } else {
      netAmount = val;
      taxAmount = val * rate;
      totalAmount = val + taxAmount;
    }

    return {
      netAmount: netAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      ratePercent
    };
  },

  // Fiat Currency Inflation Calculator
  calculateInflation(amount, annualInflationRatePercent, years) {
    const P = Number(amount);
    const r = Number(annualInflationRatePercent) / 100;
    const t = Number(years);

    const futureEquivalentCost = P * Math.pow(1 + r, t);
    const purchasingPowerRemaining = P / Math.pow(1 + r, t);
    const cumulativeInflationPercent = ((futureEquivalentCost - P) / P * 100).toFixed(1);

    return {
      futureEquivalentCost: Math.round(futureEquivalentCost),
      purchasingPowerRemaining: Math.round(purchasingPowerRemaining),
      cumulativeInflationPercent
    };
  },

  // Digital Asset Valuation
  calculateAssetValuation(annualRevenue, annualNetProfit, growthRatePercent = 20, revenueMultiple = 3.5, profitMultiple = 5.0) {
    const rev = Number(annualRevenue);
    const profit = Number(annualNetProfit);
    
    const revValuation = rev * Number(revenueMultiple);
    const profitValuation = profit * Number(profitMultiple);
    const blendedValuation = Math.round((revValuation + profitValuation) / 2);

    return {
      revenueBasedValuation: Math.round(revValuation),
      profitBasedValuation: Math.round(profitValuation),
      blendedValuation,
      lowEstimate: Math.round(blendedValuation * 0.85),
      highEstimate: Math.round(blendedValuation * 1.2)
    };
  },

  // AdSense Estimated Revenue
  calculateAdSenseRevenue(dailyPageviews, ctrPercent = 1.5, cpc = 0.25) {
    const views = Number(dailyPageviews);
    const ctr = Number(ctrPercent) / 100;
    const costPerClick = Number(cpc);

    const dailyClicks = views * ctr;
    const dailyEarnings = dailyClicks * costPerClick;
    const rpm = (dailyEarnings / views) * 1000;
    const monthlyEarnings = dailyEarnings * 30;
    const annualEarnings = dailyEarnings * 365;

    return {
      rpm: rpm.toFixed(2),
      dailyEarnings: dailyEarnings.toFixed(2),
      monthlyEarnings: Math.round(monthlyEarnings),
      annualEarnings: Math.round(annualEarnings),
      dailyClicks: Math.round(dailyClicks)
    };
  }
};
