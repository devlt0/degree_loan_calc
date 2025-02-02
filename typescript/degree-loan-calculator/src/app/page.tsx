"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
    <div className="App min-h-screen bg-gray-900  flex">
      {/* Sidebar */}
      <div className={`relative ${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-800 transition-all duration-300`}>
        <div className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 p-4 space-y-4`}>
          <h2 className="text-lg font-semibold mb-4">Input Parameters</h2>
          
          <div className="space-y-2">
            <label className="block text-sm">Current Tuition Amount</label>
            <div className="flex items-center space-x-2">
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setCurrentTuition(prev => prev - 1000)}>-</button>
              <input 
                type="number" 
                className="bg-gray-700  rounded p-1 w-full"
                value={currentTuition} 
                onChange={e => setCurrentTuition(parseFloat(e.target.value))} 
                step="1000"
              />
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setCurrentTuition(prev => prev + 1000)}>+</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Tuition Period</label>
            <select 
              className="bg-gray-700  rounded p-1 w-full"
              value={tuitionPeriod} 
              onChange={e => setTuitionPeriod(e.target.value)}
            >
              <option value="Per Semester">Per Semester</option>
              <option value="Per Year">Per Year</option>
            </select>
          </div>

          {tuitionPeriod === "Per Semester" && (
            <div className="space-y-2">
              <label className="block text-sm">Semesters per Year</label>
              <div className="flex items-center space-x-2">
                <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setSemestersPerYear(prev => Math.max(1, prev - 1))}>-</button>
                <input 
                  type="number" 
                  className="bg-gray-700  rounded p-1 w-full"
                  value={semestersPerYear} 
                  onChange={e => setSemestersPerYear(parseInt(e.target.value))} 
                  step="1"
                />
                <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setSemestersPerYear(prev => prev + 1)}>+</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm">Years for degree</label>
            <div className="flex items-center space-x-2">
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setNumberYrsCollege(prev => Math.max(1, prev - 1))}>-</button>
              <input 
                type="number" 
                className="bg-gray-700  rounded p-1 w-full"
                value={numberYrsCollege} 
                onChange={e => setNumberYrsCollege(parseInt(e.target.value))} 
                step="1"
              />
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setNumberYrsCollege(prev => prev + 1)}>+</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Annual Tuition Increase (%)</label>
            <div className="flex items-center space-x-2">
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setTuitionHike(prev => Math.max(0, prev - 1))}>-</button>
              <input 
                type="number" 
                className="bg-gray-700  rounded p-1 w-full"
                value={tuitionHike} 
                onChange={e => setTuitionHike(parseFloat(e.target.value))} 
                step="1"
              />
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setTuitionHike(prev => prev + 1)}>+</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Interest Rate (%)</label>
            <div className="flex items-center space-x-2">
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setInterestRate(prev => Math.max(0, prev - 1))}>-</button>
              <input 
                type="number" 
                className="bg-gray-700  rounded p-1 w-full"
                value={interestRate} 
                onChange={e => setInterestRate(parseFloat(e.target.value))} 
                step="1"
              />
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setInterestRate(prev => prev + 1)}>+</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Expected Starting Salary ($)</label>
            <div className="flex items-center space-x-2">
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setExpectedSalary(prev => Math.max(0, prev - 1000))}>-</button>
              <input 
                type="number" 
                className="bg-gray-700  rounded p-1 w-full"
                value={expectedSalary} 
                onChange={e => setExpectedSalary(parseInt(e.target.value))} 
                step="1000"
              />
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setExpectedSalary(prev => prev + 1000)}>+</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Monthly Cost of Living ($)</label>
            <div className="flex items-center space-x-2">
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setCostOfLiving(prev => Math.max(0, prev - 100))}>-</button>
              <input 
                type="number" 
                className="bg-gray-700  rounded p-1 w-full"
                value={costOfLiving} 
                onChange={e => setCostOfLiving(parseInt(e.target.value))} 
                step="100"
              />
              <button className="bg-gray-700 px-2 py-1 rounded" onClick={() => setCostOfLiving(prev => prev + 100)}>+</button>
            </div>
          </div>

          <button 
            onClick={handleCalculate}
            className="w-full bg-blue-600 hover:bg-blue-700  font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Calculate
          </button>
        </div>

        {/* Sidebar toggle button */}
        <button
          className="absolute -right-6 top-1/2 transform -translate-y-1/2 bg-gray-800 p-1 rounded-r"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        <h1 className="text-xl font-bold mb-6">Analyze your ability to repay student loans based on future career prospects</h1>
        
        {results.length > 0 && (
          <div className="grid grid-cols-2 gap-6">
            {/* Results table */}
            <div>
              <h2 className="text-lg font-bold mb-4">Analysis Results</h2>
              <p className="mb-4">Estimated total 4-year tuition cost: ${(currentTuition * semestersPerYear * numberYrsCollege).toFixed(2)}</p>
              <p className="mb-4">Estimated monthly take-home pay: ${estimateTakehomePay(expectedSalary).toFixed(2)}</p>

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
                    <td className="border border-gray-300 p-2 ">{result['Term (Years)']}</td>
                    <td className="border border-gray-300 p-2">{result['Monthly Payment']}</td>
                    <td className="border border-gray-300 p-2">{result['% of Take-Home']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
              <p className="text-sm">Note: Table color coding is based on loan payment % of monthly take-home</p>
            </div>

            {/* Financial Summary */}
            <div>
              <h2 className="text-lg font-bold mb-4">Financial Summary</h2>
              <div className="space-y-2">
                <p>Monthly take-home pay (after taxes + fica): ${estimateTakehomePay(expectedSalary).toFixed(2)}</p>
                <p>Estimated cost of living: ${costOfLiving}</p>
                <p>Lowest monthly payment: ${Math.min(...results.map(r => parseFloat(r["Monthly Payment"].replace("$", "").replace(",", "")))).toFixed(2)}</p>
                <p style={{ color: getColorForAmount(remainingMoney) }}>
                  Remaining monthly income: ${remainingMoney.toFixed(2)}
                </p>
                {remainingMoney < 0 && 
                  <div className="bg-red-900/50 p-4 rounded">
                    Warning: Your estimated expenses exceed your take-home pay!
                  </div>
                }
                {remainingMoney >= 0 && remainingMoney < 400 && 
                  <div className="bg-orange-900/50 p-4 rounded">
                    Caution: Very low remaining income!
                  </div>
                }
                {remainingMoney >= 400 && remainingMoney < 750 && 
                  <div className="bg-yellow-900/50 p-4 rounded">
                    Caution: Low remaining income!
                  </div>
                }
                {remainingMoney >= 750 && 
                  <div className="bg-green-900/50 p-4 rounded">
                    Financial plan appears sustainable!
                  </div>
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;