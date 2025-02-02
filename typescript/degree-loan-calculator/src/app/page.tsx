"use client";

import React, { useState } from 'react';
//import './App.css';
import './globals.css';

interface LoanDetails {
  totalTuition: number;
  interestRate: number;
  loanTerms: number[];
  monthlyTakehome: number;
}

const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
  const r = annualRate / 12;
  const n = years * 12;
  let monthlyPayment : number = 0; 
  if (r === 0) {
    monthlyPayment = principal / n;
  } else {
    monthlyPayment= principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
  return monthlyPayment
};

const getColorForRatio = (ratio: number): string => {
  let ratioColor: string = "red"
  if (ratio <= 15) ratioColor = "green";
  else if (ratio <= 33.333) ratioColor = "yellow";
  else if (ratio <= 50) ratioColor = "orange";
  return ratioColor;
};

const getColorForAmount = (remainingCash: number): string => {
  let ratioColor: string = "red"
  if (remainingCash >= 0) ratioColor = "orange";
  else if (remainingCash >= 400) ratioColor = "yellow";
  else if (remainingCash >= 750) ratioColor = "green";
   
  return ratioColor;
};

const calculateTotalTuition = (baseTuition: number, semestersPerYear: number, yearlyIncrease: number, numYrsCollege: number): number => {
  let total = 0;
  let yearlyTuition = baseTuition * semestersPerYear;
  for (let year = 0; year < numYrsCollege; year++) {
    total += yearlyTuition;
    yearlyTuition *= (1 + yearlyIncrease);
  }
  return total;
};

const estimateTakehomePay = (grossSalary: number): number => {
  let taxRate;
  if (grossSalary <= 11600) taxRate = 0.10;
  else if (grossSalary <= 47150) taxRate = 0.12;
  else if (grossSalary <= 100525) taxRate = 0.22;
  else if (grossSalary <= 191950) taxRate = 0.24;
  else taxRate = 0.32;

  const stdDeduction2024 = 13850;
  const taxableIncome = Math.max(0, grossSalary - stdDeduction2024);
  const taxes = taxableIncome * taxRate;
  const fica = grossSalary * 0.0765;
  const annualTakehome = grossSalary - taxes - fica;
  return annualTakehome / 12;
};

const App: React.FC = () => {
  const [currentTuition, setCurrentTuition] = useState(10000.0);
  const [tuitionPeriod, setTuitionPeriod] = useState("Per Semester");
  const [semestersPerYear, setSemestersPerYear] = useState(2);
  const [numberYrsCollege, setNumberYrsCollege] = useState(4);
  const [tuitionHike, setTuitionHike] = useState(5.0);
  const [interestRate, setInterestRate] = useState(9.0);
  const [expectedSalary, setExpectedSalary] = useState(50000);
  const [costOfLiving, setCostOfLiving] = useState(2500);
  const [results, setResults] = useState<any[]>([]);
  const [remainingMoney, setRemainingMoney] = useState(0);

  const handleCalculate = () => {
    const totalTuition = calculateTotalTuition(currentTuition, semestersPerYear, tuitionHike / 100, numberYrsCollege);
    const monthlyTakehome = estimateTakehomePay(expectedSalary);
    const loanTerms = [5, 10, 15, 20, 25, 30];
    const results = loanTerms.map(years => {
      const monthlyPayment = calculateMonthlyPayment(totalTuition, interestRate / 100, years);
      const paymentRatio = (monthlyPayment / monthlyTakehome) * 100;
      return {
        "Term (Years)": years,
        "Monthly Payment": `$${monthlyPayment.toFixed(2)}`,
        "% of Take-Home": `${paymentRatio.toFixed(2)}`,
      };
    });
    setResults(results);

    const lowestPayment = Math.min(...results.map(r => parseFloat(r["Monthly Payment"].replace("$", "").replace(",", ""))));
    const remaining = monthlyTakehome - lowestPayment - costOfLiving;
    setRemainingMoney(remaining);
  };

  return (
 <div className="App container mx-auto max-w-2xl p-2">
      <h1 className="text-2xl font-bold mb-6 text-center">Student Loan Repayment Calculator</h1>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <label className="text-right py-2">Current Tuition Amount:</label>
        <input 
          type="number" 
          className="border rounded p-2 w-full"
          value={currentTuition} 
          onChange={e => setCurrentTuition(parseFloat(e.target.value))} 
          step="1000"
        />

        <label className="text-right py-2">Tuition Period:</label>
        <select 
          className="border rounded p-2 w-full"
          value={tuitionPeriod} 
          onChange={e => setTuitionPeriod(e.target.value)}
        >
          <option value="Per Semester">Per Semester</option>
          <option value="Per Year">Per Year</option>
        </select>

        {tuitionPeriod === "Per Semester" && (
          <>
            <label className="text-right py-2">Semesters per Year:</label>
            <input 
              type="number" 
              className="border rounded p-2 w-full"
              value={semestersPerYear} 
              onChange={e => setSemestersPerYear(parseInt(e.target.value))} 
              step="1"
            />
          </>
        )}

        <label className="text-right py-2">Number of years for degree:</label>
        <input 
          type="number" 
          className="border rounded p-2 w-full"
          value={numberYrsCollege} 
          onChange={e => setNumberYrsCollege(parseInt(e.target.value))} 
          step="1" 
        />

        <label className="text-right py-2">Average Annual Tuition Increase (%):</label>
        <input 
          type="number" 
          className="border rounded p-2 w-full"
          value={tuitionHike} 
          onChange={e => setTuitionHike(parseFloat(e.target.value))} 
          step="1" 
        />

        <label className="text-right py-2">Average Interest Rate (%):</label>
        <input 
          type="number" 
          className="border rounded p-2 w-full"
          value={interestRate} 
          onChange={e => setInterestRate(parseFloat(e.target.value))} 
          step="1" 
        />

        <label className="text-right py-2">Expected Annual Starting Salary ($):</label>
        <input 
          type="number" 
          className="border rounded p-2 w-full"
          value={expectedSalary} 
          onChange={e => setExpectedSalary(parseInt(e.target.value))} 
          step="1000" 
        />

        <label className="text-right py-2">Estimated Monthly Cost of Living ($):</label>
        <input 
          type="number" 
          className="border rounded p-2 w-full"
          value={costOfLiving} 
          onChange={e => setCostOfLiving(parseInt(e.target.value))} 
          step="100" 
        />
      </div>

      <div className="text-center mb-6">
        <button 
          onClick={handleCalculate}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200"
        >
          Calculate
        </button>
      </div>

      {results.length > 0 && (
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Analysis Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 mb-6">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">Term (Years)</th>
                  <th className="border border-gray-300 p-2">Monthly Payment</th>
                  <th className="border border-gray-300 p-2">% of Take-Home</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} style={{ backgroundColor: getColorForRatio(parseFloat(result['% of Take-Home'])) }}>
                    <td className="border border-gray-300 p-2">{result['Term (Years)']}</td>
                    <td className="border border-gray-300 p-2">{result['Monthly Payment']}</td>
                    <td className="border border-gray-300 p-2">{result['% of Take-Home']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Financial Summary</h2>
            <p>Monthly take-home pay (after taxes + fica): ${estimateTakehomePay(expectedSalary).toFixed(2)}</p>
            <p>Estimated cost of living: ${costOfLiving}</p>
            <p>Lowest monthly payment: ${Math.min(...results.map(r => parseFloat(r["Monthly Payment"].replace("$", "").replace(",", "")))).toFixed(2)}</p>
            <p style={{ color: getColorForAmount(remainingMoney) }}>
              Remaining monthly income: ${remainingMoney.toFixed(2)}
            </p>
            {remainingMoney < 0 && <p style={{ color: 'red' }}>Warning: Your estimated expenses exceed your take-home pay!</p>}
            {remainingMoney >= 0 && remainingMoney < 400 && <p style={{ color: 'orange' }}>Caution: Your remaining monthly income is very low! Less than $400/month.</p>}
            {remainingMoney >= 400 && remainingMoney < 750 && <p style={{ color: 'yellow' }}>Caution: Your remaining monthly income is low! Less than $750/month</p>}
            {remainingMoney >= 750 && <p style={{ color: 'green' }}>Your financial plan appears sustainable! Minimum $750/month remaining.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
