const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
const salesCtx = document.getElementById("sales-expense-chart").getContext("2d");
let groupedChart, salesExpenseChart;
let rawData = {};

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
      rawData = data;
      updateKPIs(data);
      drawGroupedExpenseChart(data, category);
      drawSalesVsExpenseChart(data);
      updatePLTable(data.pnlData);
      updateSummaryTable(data.summaryMap);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data) {
  document.getElementById("salesKPI").textContent = formatPeso(data.totalSales || 0);
  document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses || 0);
  document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue || 0);
}

function drawGroupedExpenseChart(data, filterCategory) {
  const monthly = data.monthlyCategoryTotals || {};
  const monthlySales = data.monthlySales || {};
  const months = monthOrder.filter(m => monthly[m]);

  const categories = ["cogs", "fixedexpense", "laborexpense", "operatingexpense", "misc"];
  const colors = {
    cogs: "#007bff",
    fixedexpense: "#28a745",
    laborexpense: "#ffc107",
    operatingexpense: "#17a2b8",
    misc: "#6f42c1"
  };

  const filtered = filterCategory !== "all" ? [filterCategory] : categories;

  const datasets = filtered.map(cat => ({
    label: categoryLabel(cat),
    data: months.map(m => {
      const expense = (monthly[m]?.[cat] || 0);
      const sales = (monthlySales[m] || 0);
      return sales > 0 ? (expense / sales) * 100 : 0;
    }),
    backgroundColor: colors[cat],
    datalabels: {
      anchor: "end",
      align: "top",
      formatter: v => v.toFixed(1) + "%",
      color: "#000"
    }
  }));

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
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
              const month = ctx.label.toLowerCase();
              const sales = monthlySales[month] || 0;
              const peso = ((percent / 100) * sales).toLocaleString("en-PH", {
                style: 'currency', currency: 'PHP'
              });
              return `${ctx.dataset.label}: ${percent}% (${peso})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "% of Monthly Sales" }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesVsExpenseChart(data) {
  const monthly = data.monthlyCategoryTotals || {};
  const monthlySales = data.monthlySales || {};
  const months = monthOrder.filter(m => monthly[m]);

  if (salesExpenseChart) salesExpenseChart.destroy();

  const salesData = months.map(m => monthlySales[m] || 0);
  const expensesData = months.map(m => {
    const cat = monthly[m] || {};
    return Object.values(cat).reduce((sum, val) => sum + val, 0);
  });

  salesExpenseChart = new Chart(salesCtx, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [
        { label: "Sales", backgroundColor: "#28a745", data: salesData },
        { label: "Expenses", backgroundColor: "#dc3545", data: expensesData }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Monthly Sales vs Expenses" },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatPeso(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: value => formatPeso(value) }
        }
      }
    }
  });
}

function updatePLTable(pnlData) {
  const table = document.getElementById("plTable");
  table.innerHTML = "";

  if (!pnlData || pnlData.length === 0) {
    table.innerHTML = "<tr><td colspan='13'>No P&L data</td></tr>";
    return;
  }

  const header = `<tr><th>Category</th>${monthOrder.map(m => `<th>${capitalize(m)}</th>`).join("")}</tr>`;
  const rows = pnlData.map(row => {
    return `<tr><td>${row.category}</td>${monthOrder.map(m => `<td>${formatPeso(row[m] || 0)}</td>`).join("")}</tr>`;
  });

  table.innerHTML = header + rows.join("");
}

function updateSummaryTable(summaryMap) {
  const table = document.getElementById("summaryTable");
  table.innerHTML = "";

  if (!summaryMap || Object.keys(summaryMap).length === 0) {
    table.innerHTML = "<tr><td colspan='13'>No summary data</td></tr>";
    return;
  }

  const allCategories = new Set();
  monthOrder.forEach(month => {
    if (summaryMap[month]) {
      Object.keys(summaryMap[month]).forEach(cat => allCategories.add(cat));
    }
  });

  const sortedCats = Array.from(allCategories).sort();

  const header = `<tr><th>Category</th>${monthOrder.map(m => `<th>${capitalize(m)}</th>`).join("")}</tr>`;
  const rows = sortedCats.map(cat => {
    const row = `<td>${cat}</td>` + monthOrder.map(m => {
      const val = summaryMap[m]?.[cat] || 0;
      return `<td>${formatPeso(val)}</td>`;
    }).join("");
    return `<tr>${row}</tr>`;
  });

  table.innerHTML = header + rows.join("");
}

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function categoryLabel(key) {
  switch (key) {
    case "cogs": return "COGS";
    case "fixedexpense": return "Fixed Expense";
    case "laborexpense": return "Labor Expense";
    case "operatingexpense": return "Operating Expense";
    case "misc": return "Miscellaneous";
    default: return key;
  }
}

function showView(view) {
  document.getElementById("dashboard").classList.remove("active");
  document.getElementById("plSection").classList.remove("active");
  document.getElementById("summarySection").classList.remove("active");

  document.getElementById("btnDashboard").classList.remove("active");
  document.getElementById("btnPL").classList.remove("active");
  document.getElementById("btnSummary").classList.remove("active");

  document.getElementById(view).classList.add("active");
  document.getElementById("btn" + view.charAt(0).toUpperCase() + view.slice(1)).classList.add("active");
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categorySelect").addEventListener("change", () => {
    const category = document.getElementById("categorySelect").value;
    drawGroupedExpenseChart(rawData, category);
  });

  document.getElementById("btnDashboard").addEventListener("click", () => showView("dashboard"));
  document.getElementById("btnPL").addEventListener("click", () => showView("plSection"));
  document.getElementById("btnSummary").addEventListener("click", () => showView("summarySection"));

  fetchData();
});
