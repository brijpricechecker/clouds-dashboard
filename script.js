// script.js

let rawData = {};
const ctx = document.getElementById("expenseChart").getContext("2d");
let expenseChart;

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

function fetchData() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      rawData = data;
      updateKPIs(data, month);
      drawExpenseChart(data, month);
      drawPLStatement(data, month);
    })
    .catch(err => console.error("Fetch Error:", err));
}

function updateKPIs(data, selectedMonth) {
  const m = selectedMonth.toLowerCase();
  const isAll = selectedMonth === "all";

  const totalSales = isAll ? data.totalSales : data.monthlySales[m] || 0;
  const totalExpenses = isAll ? data.totalExpenses : sumObj(data.monthlyCategoryTotals[m]);
  const totalRevenue = totalSales - totalExpenses;

  document.getElementById("salesKPI").value = formatPeso(totalSales);
  document.getElementById("expensesKPI").value = formatPeso(totalExpenses);
  document.getElementById("revenueKPI").value = formatPeso(totalRevenue);
}

function drawExpenseChart(data, selectedMonth) {
  const months = monthOrder.filter(m => data.monthlySales[m]);
  const salesData = months.map(m => data.monthlySales[m] || 0);
  const expenseData = months.map(m => sumObj(data.monthlyCategoryTotals[m] || {}));

  if (expenseChart) expenseChart.destroy();

  expenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [
        { label: "Sales", backgroundColor: "#28a745", data: salesData },
        { label: "Expenses", backgroundColor: "#dc3545", data: expenseData }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Monthly Sales vs Expenses",
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatPeso(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatPeso(value)
          }
        }
      }
    }
  });
}

function drawPLStatement(data, selectedMonth) {
  const m = selectedMonth.toLowerCase();
  const isAll = selectedMonth === "all";

  const container = document.getElementById("plStatement");
  container.innerHTML = "";

  const section = (label, amount) =>
    `<div class="row mb-2"><div class="col-8 fw-bold">${label}</div><div class="col-4 text-end">${formatPeso(amount)}</div></div>`;

  const get = key => isAll ? sumAcrossMonths(data.monthlyCategoryTotals, key) : data.monthlyCategoryTotals[m]?.[key] || 0;

  const sales = isAll ? data.totalSales : data.monthlySales[m] || 0;
  const cogs = get("cogs");
  const gp = sales - cogs;
  const fixed = get("fixedexpense");
  const labor = get("laborexpense");
  const ops = get("operatingexpense");
  const misc = get("misc");
  const np = gp - (fixed + labor + ops + misc);

  let html = "";
  html += section("Sales", sales);
  html += section("COGS", `(${cogs})`);
  html += section("Gross Profit", gp);
  html += "<hr/>";
  html += section("Fixed Expenses", `(${fixed})`);
  html += section("Labor Expenses", `(${labor})`);
  html += section("Operating Expenses", `(${ops})`);
  html += section("Miscellaneous Expenses", `(${misc})`);
  html += "<hr/>";
  html += section("Net Profit", np);

  container.innerHTML = html;
}

function sumObj(obj) {
  if (!obj) return 0;
  return Object.values(obj).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
}

function sumAcrossMonths(dataMap, key) {
  return monthOrder.reduce((sum, m) => sum + (parseFloat(dataMap[m]?.[key]) || 0), 0);
}

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", {
    style: 'currency',
    currency: 'PHP'
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);

  document.getElementById("salesKPI").addEventListener("input", () => {});
  document.getElementById("expensesKPI").addEventListener("input", () => {});
  document.getElementById("revenueKPI").addEventListener("input", () => {});

  fetchData();
});
