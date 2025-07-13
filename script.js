let groupedChart, salesExpenseChart;
let rawData = {};

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

function fetchData() {
  const month = document.getElementById("monthSelect").value.toLowerCase();
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      rawData = data;
      updateKPIs(data, month);
      updateCommentary(data, month);
      drawGroupedExpenseChart(data, month);
      drawSalesVsExpenseChart(data, month);
      updatePLTable(data.plData);
      updateReportTable(data.reportData);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data, selectedMonth) {
  const m = selectedMonth.toLowerCase();

  const sales = selectedMonth === "all" ? data.totalSales : (data.monthlySales?.[m] || 0);
  const expenses = selectedMonth === "all" ? data.totalExpenses : (data.monthlyExpenses?.[m] || 0);
  const cashouts = selectedMonth === "all" ? data.totalCashouts : (data.monthlyCashouts?.[m] || 0);

  document.getElementById("salesKPI").textContent = formatPeso(sales);
  document.getElementById("expensesKPI").textContent = formatPeso(expenses);
  document.getElementById("revenueKPI").textContent = formatPeso(sales - expenses);
  document.getElementById("cashoutKPI").textContent = formatPeso(cashouts);
}

function drawGroupedExpenseChart(data, month) {
  const monthlyPercent = data.monthlyCategoryPercent || {};
  const categories = data.mainCategories || [];
  const labels = categories.map(c => capitalize(c));
  const values = categories.map(c => (monthlyPercent?.[month]?.[c] || 0));

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(document.getElementById("grouped-expense-chart").getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "% of Total Expenses",
        data: values,
        backgroundColor: '#007bff'
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Expense Category Breakdown",
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: v => v > 0 ? v.toFixed(1) + "%" : "",
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => val + "%"
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesVsExpenseChart(data, month) {
  const months = monthOrder.filter(m => data.monthlySales?.[m] !== undefined);

  const salesData = months.map(m => data.monthlySales[m] || 0);
  const expensesData = months.map(m => data.monthlyExpenses[m] || 0);

  if (salesExpenseChart) salesExpenseChart.destroy();

  salesExpenseChart = new Chart(document.getElementById("sales-expense-chart").getContext("2d"), {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [
        {
          label: "Sales",
          data: salesData,
          backgroundColor: "#28a745"
        },
        {
          label: "Expenses",
          data: expensesData,
          backgroundColor: "#dc3545"
        }
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
          ticks: {
            callback: value => formatPeso(value)
          }
        }
      }
    }
  });
}

function updatePLTable(plData) {
  const table = document.getElementById("plTable");
  if (!plData || plData.length === 0) {
    table.innerHTML = "<p>No Profit & Loss Data</p>";
    return;
  }

  const months = ["Category", ...monthOrder.map(capitalize)];
  const header = `<tr>${months.map(m => `<th>${m}</th>`).join("")}</tr>`;
  const rows = plData.map(row => {
    const cells = [row.category, ...monthOrder.map(m => {
      const val = row[m] ?? "";
      return val === 0 ? "<td></td>" : `<td>${formatPeso(val)}</td>`;
    })];
    return `<tr>${cells.join("")}</tr>`;
  });

  table.innerHTML = `<table>${header}${rows.join("")}</table>`;
}

function updateReportTable(reportData) {
  const table = document.getElementById("reportTable");
  if (!reportData || reportData.length === 0) {
    table.innerHTML = "<p>No report data available.</p>";
    return;
  }

  const months = ["Category", ...monthOrder.map(capitalize)];
  const header = `<tr>${months.map(m => `<th>${m}</th>`).join("")}</tr>`;
  const rows = reportData.map(row => {
    const cells = [row.category, ...monthOrder.map(m => {
      const val = row[m] ?? "";
      return val === 0 ? "<td></td>" : `<td>${formatPeso(val)}</td>`;
    })];
    return `<tr>${cells.join("")}</tr>`;
  });

  table.innerHTML = `<table>${header}${rows.join("")}</table>`;
}

function updateCommentary(data, selectedMonth) {
  const div = document.getElementById("aiComment");
  const m = selectedMonth.toLowerCase();

  const sales = selectedMonth === "all" ? data.totalSales : (data.monthlySales?.[m] || 0);
  const expenses = selectedMonth === "all" ? data.totalExpenses : (data.monthlyExpenses?.[m] || 0);
  const revenue = sales - expenses;

  let comment = `Sales for the selected period are ${formatPeso(sales)}, and expenses are ${formatPeso(expenses)}. `;
  if (revenue > 0) comment += `This results in a net gain of ${formatPeso(revenue)}.`;
  else if (revenue < 0) comment += `This results in a net loss of ${formatPeso(-revenue)}.`;
  else comment += `This results in a break-even.`

  div.innerHTML = `<p><strong>AI Insight:</strong> ${comment}</p>`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatPeso(val) {
  return typeof val === "number" ? val.toLocaleString("en-PH", { style: "currency", currency: "PHP" }) : val;
}

function showView(view) {
  document.getElementById("dashboard").classList.remove("visible");
  document.getElementById("plSection").classList.remove("visible");
  document.getElementById("reportSection").classList.remove("visible");

  if (view === "dashboard") document.getElementById("dashboard").classList.add("visible");
  if (view === "pl") document.getElementById("plSection").classList.add("visible");
  if (view === "report") document.getElementById("reportSection").classList.add("visible");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("btnDashboard").addEventListener("click", () => showView("dashboard"));
  document.getElementById("btnPL").addEventListener("click", () => showView("pl"));
  document.getElementById("btnReport").addEventListener("click", () => showView("report"));

  fetchData();
});
