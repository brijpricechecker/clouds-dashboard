const ctxGrouped = document.getElementById("grouped-expense-chart").getContext("2d");
let groupedChart;

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

function fetchData() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;
  const category = document.getElementById("categoryFilter").value;
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      updateKPIs(data);
      drawGroupedExpenseChart(data, category);
      buildPnLTable(data.pnlData);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data) {
  document.getElementById("salesKPI").textContent = formatPeso(data.totalSales);
  document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses);
  document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue);
}

function drawGroupedExpenseChart(data, selectedCategory) {
  const months = monthOrder.filter(m => data.monthlySales[m]);
  const monthlySales = data.monthlySales;
  const monthlyCategoryTotals = data.monthlyCategoryTotals;

  const categories = selectedCategory === "all"
    ? ["cogs", "fixedexpense", "laborexpense", "operatingexpense", "misc"]
    : [selectedCategory];

  const colors = {
    cogs: "#4caf50",
    fixedexpense: "#2196f3",
    laborexpense: "#ff9800",
    operatingexpense: "#9c27b0",
    misc: "#f44336"
  };

  const datasets = categories.map(cat => {
    return {
      label: categoryLabel(cat),
      data: months.map(month => {
        const expense = (monthlyCategoryTotals[month] && monthlyCategoryTotals[month][cat]) || 0;
        const sales = monthlySales[month] || 0;
        return sales > 0 ? (expense / sales) * 100 : 0;
      }),
      backgroundColor: colors[cat] || "#ccc",
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: v => v.toFixed(1) + "%",
        color: "#000"
      }
    };
  });

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctxGrouped, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Monthly Expenses as % of Revenue",
          font: { size: 16 }
        },
        legend: { display: categories.length > 1, position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
          }
        },
        datalabels: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "% of Net Sales"
          }
        },
        x: {
          grid: { display: false }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function buildPnLTable(pnlData) {
  const table = document.getElementById("pnlTable");
  table.innerHTML = "";
  if (!pnlData || pnlData.length === 0) return;

  const headers = Object.keys(pnlData[0]);
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const trHead = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = capitalize(h);
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);

  pnlData.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.textContent = typeof row[h] === 'number' ? formatPeso(row[h]) : row[h];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function categoryLabel(key) {
  switch (key) {
    case "cogs": return "COGS";
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

// DOM Events
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categoryFilter").addEventListener("change", fetchData);
  fetchData();
});

