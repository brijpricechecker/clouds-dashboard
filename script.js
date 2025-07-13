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
      updatePLTable(data.pnlData);
      updateSummaryTable(data.summaryMap);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data, selectedMonth) {
  const totalSales = selectedMonth === "all" ? data.totalSales : (data.monthlySales[selectedMonth] || 0);
  const totalCashouts = selectedMonth === "all" ? data.totalCashoutsTotal : (data.totalCashoutsByMonth[selectedMonth] || 0);

  let totalExpenses = selectedMonth === "all"
    ? Object.values(data.monthlyCategoryTotals || {}).reduce((sum, month) => sum + Object.values(month || {}).reduce((a, b) => a + b, 0), 0)
    : Object.values(data.monthlyCategoryTotals[selectedMonth] || {}).reduce((a, b) => a + b, 0);

  document.getElementById("salesKPI").textContent = formatPeso(totalSales);
  document.getElementById("expensesKPI").textContent = formatPeso(totalExpenses);
  document.getElementById("revenueKPI").textContent = formatPeso(totalSales - totalExpenses);

  const cashoutKPI = document.getElementById("cashoutKPI");
  if (cashoutKPI) {
    cashoutKPI.textContent = formatPeso(totalCashouts);
  }
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

function updateCommentary(data, selectedMonth) {
  const div = document.getElementById("aiComment");
  const sales = selectedMonth === "all" ? data.totalSales : data.monthlySales[selectedMonth] || 0;
  const expenses = selectedMonth === "all"
    ? Object.values(data.monthlyCategoryTotals || {}).reduce((sum, month) => sum + Object.values(month || {}).reduce((a, b) => a + b, 0), 0)
    : Object.values(data.monthlyCategoryTotals[selectedMonth] || {}).reduce((a, b) => a + b, 0);
  const revenue = sales - expenses;

  let comment = `Total sales for the selected period are ${formatPeso(sales)}, while expenses reached ${formatPeso(expenses)}.`;
  if (revenue > 0) comment += ` This results in a net positive revenue of ${formatPeso(revenue)}, indicating profitability.`;
  else if (revenue < 0) comment += ` The period ran at a loss of ${formatPeso(-revenue)}, highlighting areas to manage costs.`;
  else comment += ` The operation broke even for this period.`;
  comment += `\n\nExpenses are primarily driven by ${getTopCategory(data, selectedMonth)}.`;

  div.innerHTML = `<p><strong>AI Insight:</strong> ${comment.replace(/\n/g, "<br>")}</p>`;
}

function getTopCategory(data, month) {
  const monthlyData = data.monthlyCategoryTotals || {};
  const categories = ["cogs", "fixedexpense", "laborexpense", "operatingexpense", "misc"];

  const totals = {};

  if (month === "all") {
    for (const m of Object.keys(monthlyData)) {
      const monthData = monthlyData[m];
      if (!monthData) continue;
      for (const cat of categories) {
        totals[cat] = (totals[cat] || 0) + (monthData[cat] || 0);
      }
    }
  } else {
    const monthData = monthlyData[month] || {};
    for (const cat of categories) {
      totals[cat] = monthData[cat] || 0;
    }
  }

  let top = "";
  let max = 0;
  for (const cat in totals) {
    if (totals[cat] > max) {
      max = totals[cat];
      top = categoryLabel(cat);
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

function showView(view) {
  document.getElementById("dashboard").style.display = view === "dashboard" ? "block" : "none";
  document.getElementById("plSection").style.display = view === "pl" ? "block" : "none";
  document.getElementById("summarySection").style.display = view === "summary" ? "block" : "none";
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
    const rowHtml = `<td>${row.category}</td>` + monthOrder.map(m => {
      const val = row[m] || 0;
      return `<td>${val === 0 ? "" : formatPeso(val)}</td>`;
    }).join("");
    return `<tr>${rowHtml}</tr>`;
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
  const grouped = {};
  for (let month of monthOrder) {
    const monthData = summaryMap[month] || {};
    for (let cat in monthData) {
      const [main, sub] = cat.split("::");
      grouped[main] = grouped[main] || {};
      grouped[main][month] = (grouped[main][month] || 0) + (monthData[cat] || 0);
    }
  }
  const header = `<tr><th>Main Category</th>${monthOrder.map(m => `<th>${capitalize(m)}</th>`).join("")}</tr>`;
  const rows = Object.keys(grouped).map(main => {
    const rowHtml = `<td>${main}</td>` + monthOrder.map(m => {
      const val = grouped[main][m] || 0;
      return `<td>${val === 0 ? "" : formatPeso(val)}</td>`;
    }).join("");
    return `<tr>${rowHtml}</tr>`;
  });
  table.innerHTML = header + rows.join("");
}
