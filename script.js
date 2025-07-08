// script.js – Updated for cleaner layout with category filtering and simplified visuals

const ctxGrouped = document.getElementById("grouped-expense-chart").getContext("2d");
const ctxSalesVsExp = document.getElementById("sales-expense-chart").getContext("2d");
let groupedChart;
let salesExpenseChart;

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

function fetchData() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;
  const category = document.getElementById("categorySelect").value;
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      document.getElementById("salesKPI").textContent = formatPeso(data.totalSales);
      document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses);
      document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue);
      drawGroupedExpenseChart(data, category);
      drawSalesVsExpensesChart(data);
    })
    .catch(err => console.error("Error fetching data:", err));
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categorySelect").addEventListener("change", fetchData);
  fetchData();
});

function drawGroupedExpenseChart(data, selectedCategory) {
  const monthly = data.monthlyCategoryTotals;
  const monthlySales = data.monthlySales || {}; // New field expected from backend
  const targets = data.targets;
  const months = monthOrder.filter(m => monthly[m]);

  const categories = ["foodandbeveragespurchases", "fixedexpense", "laborexpense", "operatingexpense", "misc"];
  const colors = ["#007bff", "#28a745", "#ffc107", "#17a2b8", "#6f42c1"];

  const datasets = categories
    .filter(cat => selectedCategory === "all" || selectedCategory === cat)
    .map((cat, i) => {
      return {
        label: categoryLabel(cat),
        data: months.map(m => {
          const sales = monthlySales[m] || 1;
          const amt = monthly[m][cat] || 0;
          return sales > 0 ? (amt / sales) * 100 : 0;
        }),
        backgroundColor: colors[i],
        datalabels: {
          color: '#000',
          anchor: 'end',
          align: 'top',
          formatter: v => v.toFixed(1) + "%"
        }
      };
    });

  const targetLines = categories
    .filter(cat => selectedCategory === "all" || selectedCategory === cat)
    .map((cat, i) => {
      return {
        type: 'line',
        data: Array(months.length).fill(targets[cat]),
        borderColor: colors[i],
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        yAxisID: 'y',
        datalabels: { display: false },
        label: null
      };
    });

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctxGrouped, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [...datasets, ...targetLines]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'bottom' },
        datalabels: { display: true },
        title: {
          display: true,
          text: "Monthly Expenses as % of Revenue",
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const percent = ctx.raw.toFixed(1);
              return `${ctx.dataset.label}: ${percent}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          max: 60,
          title: {
            display: true,
            text: "% of Revenue"
          },
          grid: { display: false }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesVsExpensesChart(data) {
  const monthlySales = data.monthlySales || {};
  const monthlyExpenses = data.monthlyExpenses || {};
  const months = monthOrder.filter(m => monthlySales[m] || monthlyExpenses[m]);

  if (salesExpenseChart) salesExpenseChart.destroy();

  salesExpenseChart = new Chart(ctxSalesVsExp, {
    type: 'bar',
    data: {
      labels: months.map(capitalize),
      datasets: [
        {
          label: 'Sales',
          data: months.map(m => monthlySales[m] || 0),
          backgroundColor: '#007bff'
        },
        {
          label: 'Expenses',
          data: months.map(m => monthlyExpenses[m] || 0),
          backgroundColor: '#dc3545'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Monthly Sales vs Total Expenses',
          font: { size: 16 }
        },
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ₱${Number(ctx.raw).toLocaleString()}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'PHP Amount' },
          grid: { display: true }
        }
      }
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function categoryLabel(key) {
  switch (key) {
    case "foodandbeveragespurchases": return "Food & Beverage";
    case "fixedexpense": return "Fixed";
    case "laborexpense": return "Labor";
    case "operatingexpense": return "Operating";
    case "misc": return "Misc";
    default: return key;
  }
}

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
}
