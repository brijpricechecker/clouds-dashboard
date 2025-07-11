// script.js – Full frontend logic with P&L rendering

const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
const ctxCompare = document.getElementById("monthly-sales-expense-chart").getContext("2d");
let groupedChart;
let comparisonChart;

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
      document.getElementById("salesKPI").textContent = formatPeso(data.totalSales);
      document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses);
      document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue);

      drawGroupedExpenseChart(data);
      drawComparisonChart(data);
      window.currentPL = data.pl; // store for use by P&L button
    })
    .catch(err => console.error("Error fetching data:", err));
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categoryFilter").addEventListener("change", fetchData);
  document.getElementById("showPLBtn").addEventListener("click", showPL);
  fetchData();
});

function drawGroupedExpenseChart(data) {
  const monthly = data.monthlyCategoryTotals;
  const sales = data.monthlySales;
  const targets = data.targets;
  const selected = document.getElementById("categoryFilter").value;

  const months = monthOrder.filter(m => monthly[m]);
  const categories = {
    foodandbeveragespurchases: "Food & Bev",
    fixedexpense: "Fixed",
    laborexpense: "Labor",
    operatingexpense: "Operating",
    misc: "Misc"
  };

  const datasets = [];
  const lines = [];

  for (let key in categories) {
    if (selected === "all" || selected === key) {
      datasets.push({
        label: categories[key],
        data: months.map(m => {
          const amt = (monthly[m]?.[key] || 0);
          const sale = sales[m] || 1;
          return (amt / sale) * 100;
        }),
        backgroundColor: getColor(key),
        datalabels: {
          color: "#000",
          anchor: "end",
          align: "top",
          formatter: v => v.toFixed(1) + "%"
        }
      });

      lines.push({
        type: 'line',
        data: Array(months.length).fill(targets[key]),
        borderColor: getColor(key),
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        yAxisID: 'y',
      });
    }
  }

  if (groupedChart) groupedChart.destroy();
  groupedChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [...datasets, ...lines]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Monthly Expenses as % of Revenue" },
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const percent = ctx.raw.toFixed(1);
              const sale = sales[monthOrder[ctx.dataIndex]] || 0;
              const peso = ((percent / 100) * sale).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
              return `${ctx.dataset.label}: ${percent}% (${peso})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 60,
          grid: { display: false },
          title: { display: true, text: "% of Revenue" }
        },
        x: { grid: { display: false } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawComparisonChart(data) {
  const monthlySales = data.monthlySales;
  const monthlyExpenses = data.monthlyCategoryTotals;
  const months = monthOrder.filter(m => monthlySales[m]);

  if (comparisonChart) comparisonChart.destroy();

  comparisonChart = new Chart(ctxCompare, {
    type: 'bar',
    data: {
      labels: months.map(capitalize),
      datasets: [
        {
          label: "Sales",
          backgroundColor: "#007bff",
          data: months.map(m => monthlySales[m] || 0)
        },
        {
          label: "Expenses",
          backgroundColor: "#dc3545",
          data: months.map(m => {
            const cat = monthlyExpenses[m] || {};
            return Object.values(cat).reduce((a, b) => a + b, 0);
          })
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Monthly Sales vs Expenses" },
        legend: { position: 'bottom' }
      },
      scales: {
        y: { beginAtZero: true, grid: { display: false } },
        x: { grid: { display: false } }
      }
    }
  });
}

function showPL() {
  const pl = window.currentPL;
  if (!pl) return;

  const el = document.getElementById("plStatement");
  el.innerHTML = `
    <h3>Profit & Loss Statement</h3>
    <table>
      <tr><td><strong>Sales</strong></td><td>${formatPeso(pl.sales)}</td></tr>
      <tr><td>Less: Food & Beverage</td><td>${formatPeso(pl.foodandbeveragespurchases)}</td></tr>
      <tr><td><strong>Gross Profit</strong></td><td>${formatPeso(pl.gross)}</td></tr>
      <tr><td>Operating Expense</td><td>${formatPeso(pl.operatingexpense)}</td></tr>
      <tr><td>Fixed Expense</td><td>${formatPeso(pl.fixedexpense)}</td></tr>
      <tr><td>Labor Expense</td><td>${formatPeso(pl.laborexpense)}</td></tr>
      <tr><td>Miscellaneous</td><td>${formatPeso(pl.misc)}</td></tr>
      <tr><td><strong>Net Profit</strong></td><td>${formatPeso(pl.net)}</td></tr>
    </table>
  `;
}

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getColor(cat) {
  return {
    foodandbeveragespurchases: "#007bff",
    fixedexpense: "#28a745",
    laborexpense: "#ffc107",
    operatingexpense: "#17a2b8",
    misc: "#6f42c1"
  }[cat] || "#999";
}
