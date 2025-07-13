let rawData = {};
const monthOrder = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function fetchData() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value.toLowerCase();
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      rawData = data;
      updateKPIs(data.kpi);
      updatePLTable(data.plData);
      updateCommentary(data.kpi, month);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(kpi) {
  document.getElementById("salesKPI").textContent = formatPeso(kpi.totalSales || 0);
  document.getElementById("expensesKPI").textContent = formatPeso(kpi.totalExpenses || 0);
  document.getElementById("revenueKPI").textContent = formatPeso(kpi.revenue || 0);
  document.getElementById("cashoutKPI").textContent = formatPeso(kpi.cashout || 0);
}

function updatePLTable(plData) {
  const table = document.getElementById("plTable");
  table.innerHTML = "";

  if (!plData || plData.length === 0) {
    table.innerHTML = "<p>No Profit & Loss Data</p>";
    return;
  }

  const headers = Object.keys(plData[0]);
  const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  const rows = plData.map(row =>
    `<tr>${headers.map(h => {
      const val = row[h];
      return `<td>${(val === 0 || val === "0") ? "" : (isNaN(val) ? val : formatPeso(val))}</td>`;
    }).join("")}</tr>`
  ).join("");

  table.innerHTML = `<table class="styled-table">${headerRow}${rows}</table>`;
}

function updateCommentary(kpi, month) {
  const div = document.getElementById("aiComment");
  const sales = kpi.totalSales || 0;
  const expenses = kpi.totalExpenses || 0;
  const revenue = kpi.revenue || 0;

  let comment = `Total sales for ${capitalize(month)}: ${formatPeso(sales)}, `
              + `expenses: ${formatPeso(expenses)}. `;
  if (revenue > 0) {
    comment += `The business is profitable with net revenue of ${formatPeso(revenue)}.`;
  } else if (revenue < 0) {
    comment += `The period ran at a loss of ${formatPeso(-revenue)}.`;
  } else {
    comment += `The operation broke even for this month.`;
  }

  div.innerHTML = `<p><strong>AI Insight:</strong> ${comment}</p>`;
}

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showView(view) {
  document.getElementById("dashboard").style.display = view === "dashboard" ? "block" : "none";
  document.getElementById("plSection").style.display = view === "pl" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("btnDashboard").addEventListener("click", () => showView("dashboard"));
  document.getElementById("btnPL").addEventListener("click", () => showView("pl"));
  fetchData(); // initial load
});
