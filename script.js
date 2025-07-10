// script.js – full dashboard logic with P&L toggle and clean layout

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

let groupedChart, salesExpenseChart;

function fetchData() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      updateKPIs(data);
      drawGroupedExpenseChart(data);
      drawSalesExpenseChart(data);
      generatePLTable(data.pl);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data) {
  document.getElementById("salesKPI").textContent = formatPeso(data.totalSales);
  document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses);
  document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue);
}

function drawGroupedExpenseChart(data) {
  const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
  const monthly = data.monthlyCategoryTotals;
  const monthlySales = data.monthlySales;
  const targets = data.targets;
  const selected = ["foodandbeveragespurchases", "fixedexpense", "laborexpense", "operatingexpense", "misc"];
  const colors = ["#6ec1e4", "#94d2bd", "#f9c74f", "#f9844a", "#dabfff"];

  const months = monthOrder.filter(m => monthly[m]);

  const datasets = selected.map((cat, i) => {
    return {
      label: categoryLabel(cat),
      data: months.map(m => {
        const amt = monthly[m][cat] || 0;
        const sales = monthlySales[m] || 1;
        return (amt / sales) * 100;
      }),
      backgroundColor: colors[i],
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#333',
        formatter: v => v.toFixed(1) + "%"
      }
    }
  });

  const targetLines = selected.map((cat, i) => ({
    type: 'line',
    data: Array(months.length).fill(targets[cat]),
    borderColor: colors[i],
    borderDash: [5, 5],
    borderWidth: 1,
    pointRadius: 0,
    fill: false,
    yAxisID: 'y',
    datalabels: { display: false }
  }));

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [...datasets, ...targetLines]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: { display: true },
        legend: { display: true, position: 'bottom' },
        title: {
          display: true,
          text: "Monthly Expenses as % of Revenue"
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 60,
          title: {
            display: true,
            text: "% of Revenue"
          },
          grid: { display: false }
        },
        x: {
          grid: { display: false }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesExpenseChart(data) {
  const ctx = document.getElementById("sales-expense-chart").getContext("2d");
  const monthlySales = data.monthlySales;
  const monthlyExpenses = data.monthlyExpenses;
  const months = monthOrder.filter(m => monthlySales[m]);

  const salesData = months.map(m => monthlySales[m] || 0);
  const expData = months.map(m => monthlyExpenses[m] || 0);

  if (salesExpenseChart) salesExpenseChart.destroy();

  salesExpenseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(capitalize),
      datasets: [
        {
          label: 'Sales',
          data: salesData,
          backgroundColor: '#a1cfff'
        },
        {
          label: 'Expenses',
          data: expData,
          backgroundColor: '#ffc6c6'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: 'Monthly Sales vs Expenses'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { display: false }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function generatePLTable(pl) {
  const months = monthOrder.filter(m => pl.monthly[m]);
  const div = document.getElementById("plTable");
  let html = `<table><thead><tr><th>Item</th><th>Total</th>`;
  months.forEach(m => html += `<th>${capitalize(m)}</th>`);
  html += `</tr></thead><tbody>`;

  const rows = ["Sales", "Expenses", "Net"];
  rows.forEach(row => {
    html += `<tr><td>${row}</td><td>${formatPeso(pl.total[row])}</td>`;
    months.forEach(m => html += `<td>${formatPeso(pl.monthly[m][row])}</td>`);
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  div.innerHTML = html;
}

function togglePL() {
  const pl = document.getElementById("plSection");
  const dash = document.getElementById("dashboard");
  pl.classList.toggle("hidden");
  dash.classList.toggle("hidden");
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

document.addEventListener("DOMContentLoaded", () => {
  const yearSel = document.getElementById("yearSelect");
  const now = new Date();
  for (let y = now.getFullYear(); y >= 2022; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSel.appendChild(opt);
  }
  yearSel.value = now.getFullYear();
  document.getElementById("monthSelect").value = "all";

  yearSel.addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  fetchData();
});
