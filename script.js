// script.js – Updated for cleaner grouped chart with category filter

const ctxGrouped = document.getElementById("grouped-expense-chart").getContext("2d");
const ctxSales = document.getElementById("sales-expense-chart").getContext("2d");
let groupedChart, salesExpenseChart;

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
      drawSalesVsExpenseChart(data);
    })
    .catch(err => console.error("Error fetching data:", err));
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categorySelect").addEventListener("change", fetchData);
  fetchData();
});

function drawGroupedExpenseChart(data, filterCategory) {
  const monthly = data.monthlyCategoryTotals;
  const monthlySales = data.totalSalesPerMonth;
  const targets = data.targets;

  const months = monthOrder.filter(m => monthly[m]);
  const categories = filterCategory === "all" ? Object.keys(targets) : [filterCategory];
  const colors = {
    foodandbeveragespurchases: "#007bff",
    fixedexpense: "#28a745",
    laborexpense: "#ffc107",
    operatingexpense: "#17a2b8",
    misc: "#6f42c1"
  };

  const datasets = categories.map(cat => {
    return {
      label: categoryLabel(cat),
      data: months.map(m => {
        const catAmt = (monthly[m]?.[cat] || 0);
        const sale = monthlySales[m] || 0;
        return sale > 0 ? (catAmt / sale) * 100 : 0;
      }),
      backgroundColor: colors[cat] || "#999",
      datalabels: {
        color: '#000', anchor: 'end', align: 'top', formatter: v => v.toFixed(1) + "%"
      }
    };
  });

  const targetLines = categories.map(cat => {
    return {
      type: 'line',
      data: Array(months.length).fill(targets[cat]),
      borderColor: colors[cat],
      borderDash: [5, 5],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      yAxisID: 'y'
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
        title: { display: true, text: "Monthly Expenses as % of Revenue" },
        legend: { display: true, position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const percent = ctx.raw?.toFixed?.(1);
              const month = ctx.label.toLowerCase();
              const sales = monthlySales[month] || 0;
              const peso = ((percent / 100) * sales).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
              return `${ctx.dataset.label}: ${percent}% (${peso})`;
            }
          }
        },
        datalabels: {
          display: true,
          anchor: 'end',
          align: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { display: false },
          title: { display: true, text: "% of Revenue" }
        },
        x: { grid: { display: false } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesVsExpenseChart(data) {
  const months = monthOrder;
  const salesData = months.map(m => data.totalSalesPerMonth[m] || 0);
  const expenseData = months.map(m => data.totalExpensesPerMonth[m] || 0);

  if (salesExpenseChart) salesExpenseChart.destroy();

  salesExpenseChart = new Chart(ctxSales, {
    type: 'bar',
    data: {
      labels: months.map(capitalize),
      datasets: [
        { label: 'Sales', data: salesData, backgroundColor: '#007bff' },
        { label: 'Expenses', data: expenseData, backgroundColor: '#dc3545' }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Monthly Sales vs Expenses" },
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ` + formatPeso(ctx.raw)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { display: false },
          title: { display: true, text: "PHP" }
        },
        x: { grid: { display: false } }
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
