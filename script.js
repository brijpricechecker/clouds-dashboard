let groupedChart, salesExpenseChart;
let rawData = {};

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

function fetchData() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value.toLowerCase();
  const category = document.getElementById("categorySelect").value;
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      rawData = data;
      updateKPIs(data, month);
      updateCommentary(data, month);
      drawGroupedExpenseChart(data, category, month);
      if (month === "all") {
        document.getElementById("sales-expense-chart").style.display = "block";
        drawSalesVsExpenseChart(data);
      } else {
        document.getElementById("sales-expense-chart").style.display = "none";
      }
      updatePLTable(data.plData || []);
      updateReportTable(data.reportData || []);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data, selectedMonth) {
  const monthKey = selectedMonth.toLowerCase();
  const sales = selectedMonth === "all" ? data.totalSales : data.monthlySales?.[monthKey] || 0;
  const expenses = selectedMonth === "all" ? data.totalExpenses : data.monthlyExpenses?.[monthKey] || 0;
  const cashouts = selectedMonth === "all" ? data.totalCashouts : data.monthlyCashouts?.[monthKey] || 0;
  const revenue = sales - expenses;

  document.getElementById("salesKPI").textContent = formatPeso(sales);
  document.getElementById("expensesKPI").textContent = formatPeso(expenses);
  document.getElementById("revenueKPI").textContent = formatPeso(revenue);
  document.getElementById("cashoutKPI").textContent = formatPeso(cashouts);
}

function drawGroupedExpenseChart(data, filterCategory, selectedMonth) {
  const monthly = data.monthlyCategoryTotals || {};
  const monthlySales = data.monthlySales || {};
  const months = selectedMonth === "all" ? monthOrder.filter(m => monthly[m]) : [selectedMonth];

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

  groupedChart = new Chart(document.getElementById("grouped-expense-chart").getContext("2d"), {
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
    const categories = monthly[m] || {};
    return Object.values(categories).reduce((sum, v) => sum + v, 0);
  });

  salesExpenseChart = new Chart(document.getElementById("sales-expense-chart").getContext("2d"), {
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

function updatePLTable(plData) {
  const table = document.getElementById("plTable");
  table.innerHTML = "";

  if (!plData || plData.length === 0) {
    table.innerHTML = "<p>No Profit & Loss Data</p>";
    return;
  }

  const headers = Object.keys(plData[0]).map(h => `<th>${capitalize(h)}</th>`).join("");
  const rows = plData.map(row => {
    const cells = Object.values(row).map(val => `<td>${val === 0 ? "" : formatPeso(val)}</td>`).join("");
    return `<tr>${cells}</tr>`;
  });

  table.innerHTML = `<thead><tr>${headers}</tr></thead><tbody>${rows.join("")}</tbody>`;
}

function updateReportTable(reportData) {
  const table = document.getElementById("reportTable");
  table.innerHTML = "";

  if (!reportData || reportData.length === 0) {
    table.innerHTML = "<p>No Sales & Expense Report Data</p>";
    return;
  }

  const headers = Object.keys(reportData[0]).map(h => `<th>${capitalize(h)}</th>`).join("");
  const rows = reportData.map(row => {
    const cells = Object.values(row).map(val => `<td>${val === 0 ? "" : formatPeso(val)}</td>`).join("");
    return `<tr>${cells}</tr>`;
  });

  table.innerHTML = `<thead><tr>${headers}</tr></thead><tbody>${rows.join("")}</tbody>`;
}

function updateCommentary(data, selectedMonth) {
  const div = document.getElementById("aiComment");
  if (!div) return;

  const month = selectedMonth.toLowerCase();
  const sales = selectedMonth === "all" ? data.totalSales : data.monthlySales?.[month] || 0;
  const expenses = selectedMonth === "all" ? data.totalExpenses : data.monthlyExpenses?.[month] || 0;
  const revenue = sales - expenses;

  let comment = `Total sales for the selected period are ${formatPeso(sales)}, while expenses reached ${formatPeso(expenses)}.`;
  if (revenue > 0) comment += ` Net revenue is ${formatPeso(revenue)}, indicating profitability.`;
  else if (revenue < 0) comment += ` The period ran at a loss of ${formatPeso(-revenue)}.`;
  else comment += ` The operation broke even.`;

  div.innerHTML = `<p><strong>AI Insight:</strong> ${comment}</p>`;
}

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  });
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
  document.getElementById("dashboard").style.display = view === "dashboard" ? "block" : "none";
  document.getElementById("plSection").style.display = view === "pl" ? "block" : "none";
  document.getElementById("reportSection").style.display = view === "report" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categorySelect").addEventListener("change", () => {
    const category = document.getElementById("categorySelect").value;
    const month = document.getElementById("monthSelect").value.toLowerCase();
    drawGroupedExpenseChart(rawData, category, month);
  });

  document.getElementById("btnDashboard").addEventListener("click", () => showView("dashboard"));
  document.getElementById("btnPL").addEventListener("click", () => showView("pl"));
  document.getElementById("btnReport").addEventListener("click", () => showView("report"));

  fetchData();
});
