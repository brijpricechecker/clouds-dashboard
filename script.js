let groupedChart, salesExpenseChart;
let rawData = {};

const monthOrder = [
  "january", "february", "march", "april", "may", "june"
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
      updatePLTable(data.plData);
      updateSummaryTable(data.summaryMap);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data, selectedMonth) {
  const totalSales = selectedMonth === "all" ? data.totalSales : (data.monthlySales[selectedMonth] || 0);
  const totalExpenses = selectedMonth === "all"
    ? data.totalExpenses
    : Object.values(data.monthlyCategoryTotals[selectedMonth] || {}).reduce((a, b) => a + b, 0);

  document.getElementById("salesKPI").textContent = formatPeso(totalSales);
  document.getElementById("expensesKPI").textContent = formatPeso(totalExpenses);
  document.getElementById("revenueKPI").textContent = formatPeso(totalSales - totalExpenses);
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

function updatePLTable(pnlData) {
  const table = document.getElementById("plTable");
  table.innerHTML = "";

  if (!pnlData || pnlData.length === 0) {
    table.innerHTML = "<p>No Profit & Loss Data</p>";
    return;
  }

  const header = `<tr><th>Category</th>${monthOrder.map(m => `<th>${capitalize(m)}</th>`).join("")}</tr>`;
  const rows = pnlData.map(row => {
    const cells = monthOrder.map(m => {
      const val = row[m] || 0;
      return `<td>${val ? formatPeso(val) : ""}</td>`;
    }).join("");
    return `<tr><td><strong>${row.category}</strong></td>${cells}</tr>`;
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

  const allKeys = new Set();
  Object.values(summaryMap).forEach(monthData => {
    Object.keys(monthData).forEach(key => allKeys.add(key));
  });

  const sorted = Array.from(allKeys).sort();

  const header = `<tr><th>Main Category</th><th>Subcategory</th>${monthOrder.map(m => `<th>${capitalize(m)}</th>`).join("")}</tr>`;
  const rows = sorted.map(k => {
    const [main, sub] = k.split("||");
    const cells = monthOrder.map(m => {
      const val = summaryMap[m]?.[k] || 0;
      return `<td>${val ? formatPeso(val) : ""}</td>`;
    }).join("");
    return `<tr><td>${main}</td><td>${sub}</td>${cells}</tr>`;
  });

  table.innerHTML = header + rows.join("");
}

function updateCommentary(data, selectedMonth) {
  const div = document.getElementById("aiComment");
  const sales = selectedMonth === "all" ? data.totalSales : data.monthlySales[selectedMonth] || 0;
  const expenses = selectedMonth === "all"
    ? data.totalExpenses
    : Object.values(data.monthlyCategoryTotals[selectedMonth] || {}).reduce((a, b) => a + b, 0);
  const revenue = sales - expenses;
  let comment = `Total sales for the selected period are ${formatPeso(sales)}, while expenses reached ${formatPeso(expenses)}.`;
  if (revenue > 0) comment += ` Net revenue of ${formatPeso(revenue)} indicates profitability.`;
  else if (revenue < 0) comment += ` The period ran at a loss of ${formatPeso(-revenue)}.`;
  else comment += ` The operation broke even.`;
  comment += `\n\nHighest cost contributor: ${getTopCategory(data, selectedMonth)}.`;

  div.innerHTML = `<p><strong>AI Insight:</strong> ${comment.replace(/\n/g, "<br>")}</p>`;
}

function getTopCategory(data, month) {
  const catData = data.monthlyCategoryTotals[month] || {};
  let max = 0, top = "";
  for (let k in catData) {
    if (catData[k] > max) {
      max = catData[k];
      top = categoryLabel(k);
    }
  }
  return top || "various categories";
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
  document.getElementById("dashboard").style.display = view === "dashboard" ? "block" : "none";
  document.getElementById("plSection").style.display = view === "pl" ? "block" : "none";
  document.getElementById("summarySection").style.display = view === "summary" ? "block" : "none";
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
  document.getElementById("btnSummary").addEventListener("click", () => showView("summary"));

  fetchData();
});
