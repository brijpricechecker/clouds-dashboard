// NOTE: Adjust this to your deployment ID
const scriptUrl = "https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec";

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

let rawData = {};
let salesChart, expenseChart;

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("btnDashboard").addEventListener("click", () => showSection("dashboard"));
  document.getElementById("btnPL").addEventListener("click", () => showSection("plSection"));
  document.getElementById("btnReport").addEventListener("click", () => showSection("reportSection"));
  fetchData();
});

function fetchData() {
  const month = document.getElementById("monthSelect").value.toLowerCase();
  fetch(`${scriptUrl}?month=${month}`)
    .then(res => res.json())
    .then(data => {
      rawData = data;
      updateKPIs(data, month);
      updateCommentary(data, month);
      drawCharts(data, month);
      updatePLTable(data.plData);
      updateReportTable(data.reportData);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data, month) {
  const sales = data.monthlySales?.[month] ?? data.totalSales ?? 0;
  const expenses = data.monthlyExpenses?.[month] ?? data.totalExpenses ?? 0;
  const cashouts = data.monthlyCashouts?.[month] ?? data.totalCashouts ?? 0;

  document.getElementById("salesKPI").textContent = formatPeso(sales);
  document.getElementById("expensesKPI").textContent = formatPeso(expenses);
  document.getElementById("revenueKPI").textContent = formatPeso(sales - expenses);
  document.getElementById("cashoutKPI").textContent = formatPeso(cashouts);
}

function drawCharts(data, month) {
  const categories = data.mainCategories || [];
  const percentData = categories.map(cat => data.monthlyCategoryPercent?.[month]?.[cat] || 0);
  const expenseLabels = categories.map(c => capitalize(c));

  if (expenseChart) expenseChart.destroy();
  expenseChart = new Chart(document.getElementById("grouped-expense-chart").getContext("2d"), {
    type: "bar",
    data: {
      labels: expenseLabels,
      datasets: [{
        label: "% of Expenses",
        data: percentData,
        backgroundColor: "#007bff"
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: "Expenses Breakdown by Category" },
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: v => v ? v.toFixed(1) + "%" : "",
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: val => val + "%" }
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  const months = monthOrder.filter(m => data.monthlySales?.[m] !== undefined);
  const salesData = months.map(m => data.monthlySales?.[m] ?? 0);
  const expenseData = months.map(m => data.monthlyExpenses?.[m] ?? 0);

  if (salesChart) salesChart.destroy();
  salesChart = new Chart(document.getElementById("sales-expense-chart").getContext("2d"), {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [
        { label: "Sales", data: salesData, backgroundColor: "#28a745" },
        { label: "Expenses", data: expenseData, backgroundColor: "#dc3545" }
      ]
    },
    options: {
      plugins: {
        title: { display: true, text: "Sales vs Expenses" }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: val => formatPeso(val) }
        }
      }
    }
  });
}

function updatePLTable(plData) {
  const table = document.getElementById("plTable");
  if (!plData?.length) {
    table.innerHTML = "<p>No Profit & Loss Data</p>";
    return;
  }
  const header = `<tr><th>Category</th>${monthOrder.map(m => `<th>${capitalize(m)}</th>`).join("")}</tr>`;
  const rows = plData.map(row => {
    const cells = [row.category, ...monthOrder.map(m => row[m] ? `<td>${formatPeso(row[m])}</td>` : "<td></td>")];
    return `<tr>${cells.join("")}</tr>`;
  });
  table.innerHTML = `<table>${header}${rows.join("")}</table>`;
}

function updateReportTable(reportData) {
  const table = document.getElementById("reportTable");
  if (!reportData?.length) {
    table.innerHTML = "<p>No Report Data</p>";
    return;
  }
  const header = `<tr><th>Category</th>${monthOrder.map(m => `<th>${capitalize(m)}</th>`).join("")}</tr>`;
  const rows = reportData.map(row => {
    const cells = [row.category, ...monthOrder.map(m => row[m] ? `<td>${formatPeso(row[m])}</td>` : "<td></td>")];
    return `<tr>${cells.join("")}</tr>`;
  });
  table.innerHTML = `<table>${header}${rows.join("")}</table>`;
}

function updateCommentary(data, month) {
  const div = document.getElementById("aiComment");
  const sales = data.monthlySales?.[month] ?? 0;
  const expenses = data.monthlyExpenses?.[month] ?? 0;
  const revenue = sales - expenses;
  let comment = `Sales: ${formatPeso(sales)} | Expenses: ${formatPeso(expenses)}.`;
  comment += revenue > 0 ? ` Profit: ${formatPeso(revenue)}.` : revenue < 0 ? ` Loss: ${formatPeso(-revenue)}.` : ` Break-even.`;
  div.innerHTML = `<p><strong>AI Insight:</strong> ${comment}</p>`;
}

function formatPeso(val) {
  return typeof val === "number" ? val.toLocaleString("en-PH", { style: "currency", currency: "PHP" }) : val;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showSection(id) {
  ["dashboard", "plSection", "reportSection"].forEach(s => {
    document.getElementById(s).style.display = s === id ? "block" : "none";
  });
}
