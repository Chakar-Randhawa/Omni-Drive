import React, { useState } from 'react';
import { financeEngine } from '../../utils/financeEngine';
import { Icon } from '../Icons';

export const FinanceWorkspace = ({ tool }) => {
  // Input states
  const [loanPrincipal, setLoanPrincipal] = useState(250000);
  const [loanRate, setLoanRate] = useState(6.5);
  const [loanTenure, setLoanTenure] = useState(15);

  const [dcaAmount, setDcaAmount] = useState(100);
  const [dcaCount, setDcaCount] = useState(24);
  const [dcaAvgBuy, setDcaAvgBuy] = useState(35000);
  const [dcaCurrentPrice, setDcaCurrentPrice] = useState(62000);

  const [saasCustomers, setSaasCustomers] = useState(150);
  const [saasArpu, setSaasArpu] = useState(49);
  const [saasNewMonthly, setSaasNewMonthly] = useState(15);
  const [saasChurn, setSaasChurn] = useState(3.5);

  const [freelanceTarget, setFreelanceTarget] = useState(90000);
  const [freelanceExpenses, setFreelanceExpenses] = useState(12000);
  const [freelanceHours, setFreelanceHours] = useState(28);

  const [compoundPrincipal, setCompoundPrincipal] = useState(10000);
  const [compoundMonthly, setCompoundMonthly] = useState(500);
  const [compoundRate, setCompoundRate] = useState(8);
  const [compoundYears, setCompoundYears] = useState(20);

  const [vatAmount, setVatAmount] = useState(1000);
  const [vatRate, setVatRate] = useState(20);
  const [vatInclusive, setVatInclusive] = useState(false);

  const [adsenseViews, setAdsenseViews] = useState(10000);
  const [adsenseCtr, setAdsenseCtr] = useState(1.8);
  const [adsenseCpc, setAdsenseCpc] = useState(0.35);

  const [calcResult, setCalcResult] = useState(null);

  const handleCompute = () => {
    switch (tool.id) {
      case 'fin-loan-emi-amortization-schedule':
        setCalcResult(financeEngine.calculateLoanEMI(loanPrincipal, loanRate, loanTenure));
        break;
      case 'fin-crypto-dca-profit-calculator':
        setCalcResult(financeEngine.calculateCryptoDCA(dcaAmount, dcaCount, dcaAvgBuy, dcaCurrentPrice));
        break;
      case 'fin-saas-mrr-churn-pricing-calculator':
        setCalcResult(financeEngine.calculateSaaSMetrics(saasCustomers, saasArpu, saasNewMonthly, saasChurn));
        break;
      case 'fin-freelance-hourly-rate-calculator':
        setCalcResult(financeEngine.calculateFreelanceRate(freelanceTarget, freelanceExpenses, freelanceHours));
        break;
      case 'fin-compound-interest-wealth-projection':
        setCalcResult(financeEngine.calculateCompoundInterest(compoundPrincipal, compoundMonthly, compoundRate, compoundYears));
        break;
      case 'fin-global-sales-tax-vat-calculator':
        setCalcResult(financeEngine.calculateVAT(vatAmount, vatRate, vatInclusive));
        break;
      case 'fin-adsense-estimated-revenue-calculator':
        setCalcResult(financeEngine.calculateAdSenseRevenue(adsenseViews, adsenseCtr, adsenseCpc));
        break;
      case 'fin-ecom-profit-margin-roi-calculator':
        setCalcResult(financeEngine.calculateEcomMargin(49.99, 14.50, 5.00, 15, 12));
        break;
      case 'fin-fiat-currency-inflation-calculator':
        setCalcResult(financeEngine.calculateInflation(10000, 3.2, 10));
        break;
      case 'fin-digital-asset-valuation-calculator':
        setCalcResult(financeEngine.calculateAssetValuation(120000, 75000));
        break;
      default:
        throw new Error(`Unsupported or unhandled finance tool operation: ${tool.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Parameter Inputs */}
      <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
          Calculation Inputs
        </h4>

        {tool.id === 'fin-loan-emi-amortization-schedule' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Loan Amount ($)</label>
              <input
                type="number"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Annual Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={loanRate}
                onChange={(e) => setLoanRate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Tenure (Years)</label>
              <input
                type="number"
                value={loanTenure}
                onChange={(e) => setLoanTenure(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
          </div>
        )}

        {tool.id === 'fin-compound-interest-wealth-projection' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Initial Principal ($)</label>
              <input
                type="number"
                value={compoundPrincipal}
                onChange={(e) => setCompoundPrincipal(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Monthly Deposit ($)</label>
              <input
                type="number"
                value={compoundMonthly}
                onChange={(e) => setCompoundMonthly(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Annual Return (%)</label>
              <input
                type="number"
                value={compoundRate}
                onChange={(e) => setCompoundRate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Years to Grow</label>
              <input
                type="number"
                value={compoundYears}
                onChange={(e) => setCompoundYears(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
          </div>
        )}

        {tool.id === 'fin-crypto-dca-profit-calculator' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Recurring Amount ($)</label>
              <input
                type="number"
                value={dcaAmount}
                onChange={(e) => setDcaAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Purchases Count</label>
              <input
                type="number"
                value={dcaCount}
                onChange={(e) => setDcaCount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Avg Buy Price ($)</label>
              <input
                type="number"
                value={dcaAvgBuy}
                onChange={(e) => setDcaAvgBuy(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Current Price ($)</label>
              <input
                type="number"
                value={dcaCurrentPrice}
                onChange={(e) => setDcaCurrentPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
          </div>
        )}

        {tool.id === 'fin-adsense-estimated-revenue-calculator' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Daily Pageviews</label>
              <input
                type="number"
                value={adsenseViews}
                onChange={(e) => setAdsenseViews(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Click-Through Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={adsenseCtr}
                onChange={(e) => setAdsenseCtr(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1">Cost Per Click ($)</label>
              <input
                type="number"
                step="0.05"
                value={adsenseCpc}
                onChange={(e) => setAdsenseCpc(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleCompute}
          className="px-6 py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4949B8] text-white font-semibold text-sm cursor-pointer shadow-xs"
        >
          Calculate Results
        </button>
      </div>

      {/* Primary Result Dashboard */}
      {calcResult && (
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-6 shadow-xs">
          <div className="pb-3 border-b border-[#EEF0F4]">
            <h4 className="text-sm font-bold text-[#111827]">Financial Projections & Breakdown</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(calcResult).filter(([k]) => k !== 'schedule' && k !== 'yearlyBreakdown').map(([k, v]) => (
              <div key={k} className="p-4 rounded-xl bg-[#F7F8FC] border border-[#EEF0F4] space-y-1">
                <p className="text-[10px] uppercase font-bold text-[#6B7280]">{k.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-xl font-extrabold text-[#111827]">
                  {typeof v === 'number' && !String(v).includes('.') ? `$${v.toLocaleString()}` : String(v)}
                </p>
              </div>
            ))}
          </div>

          {/* Amortization Table */}
          {calcResult.schedule && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-[#111827] uppercase">Month-by-Month Schedule (First 12 Months)</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F8FC] text-[#6B7280]">
                    <tr>
                      <th className="p-2">Month</th>
                      <th className="p-2">EMI</th>
                      <th className="p-2">Principal</th>
                      <th className="p-2">Interest</th>
                      <th className="p-2">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF0F4]">
                    {calcResult.schedule.slice(0, 12).map((row) => (
                      <tr key={row.month}>
                        <td className="p-2 font-medium">{row.month}</td>
                        <td className="p-2">${row.emi.toLocaleString()}</td>
                        <td className="p-2 text-[#16A34A]">${row.principal.toLocaleString()}</td>
                        <td className="p-2 text-[#D97706]">${row.interest.toLocaleString()}</td>
                        <td className="p-2">${row.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default FinanceWorkspace;
