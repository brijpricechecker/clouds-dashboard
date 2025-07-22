let reportData = null;

document.addEventListener("DOMContentLoaded", () => {
  showDashboard();
  document.getElementById("filterBtn").addEventListener("click", applyFilters);
  document.getElementById("exportPdfBtn").addEventListener("click", exportFilteredReportToPDF);
});

function showDashboard() {
  document.getElementById('dashboardView').style.display = 'block';
  document.getElementById('reportView').style.display = 'none';
  loadDashboard();
}

function showReport() {
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('reportView').style.display = 'block';
  loadReport();
}

function applyFilters() {
  loadDashboard();
  loadReport();
}

function getFilters() {
  const year = document.getElementById("yearSelect").value || "2025";
  const month = document.getElementById("monthSelect").value || "ALL";
  const category = document.getElementById("categorySelect").value || "ALL";
  return { year, month, category };
}

function loadDashboard() {
  const { year, month, category } = getFilters();
  fetch(`https://script.google.com/macros/s/YOUR_DEPLOYED_URL/exec?year=${year}&month=${month}&category=${category}`)
    .then(res => res.json())
    .then(data => {
      updateKPIs(data.kpis);
      drawCharts(data.expenseChart, data.salesExpense);
    })
    .catch(err => {
      console.error("Dashboard data fetch failed:", err);
    });
}

function loadReport() {
  const { year, month, category } = getFilters();
  fetch(`https://script.google.com/macros/s/YOUR_DEPLOYED_URL/exec?year=${year}&month=${month}&category=${category}`)
    .then(res => res.json())
    .then(data => {
      reportData = data.reportHTML;
      const styled = styleReportHTML(data.reportHTML);
      document.getElementById("reportContainer").innerHTML = styled;
    })
    .catch(err => {
      document.getElementById("reportContainer").innerText = "Failed to load report.";
      console.error("Report data fetch failed:", err);
    });
}

function updateKPIs(kpi) {
  document.getElementById("totalSales").innerText = formatCurrency(kpi.totalSales);
  document.getElementById("totalExpenses").innerText = formatCurrency(kpi.totalExpenses);
  document.getElementById("revenue").innerText = formatCurrency(kpi.revenue);
  document.getElementById("cashout").innerText = formatCurrency(kpi.cashout);
}

function drawCharts(expenseChart, salesExpense) {
  drawExpenseChart(expenseChart);
  drawSalesExpenseChart(salesExpense);
}

function drawExpenseChart(chart) {
  const data = new google.visualization.DataTable();
  data.addColumn('string', 'Month');
  chart.groups.forEach(group => {
    data.addColumn('number', group.name);
  });

  for (let i = 0; i < chart.months.length; i++) {
    const row = [chart.months[i]];
    chart.groups.forEach(group => {
      row.push(group.values[i] || 0);
    });
    data.addRow(row);
  }

  const options = {
    title: 'Expenses as % of Sales',
    isStacked: true,
    vAxis: {
      format: '#\'%\''
    },
    height: 300
  };

  new google.visualization.ColumnChart(document.getElementById("expenseChart")).draw(data, options);
}

function drawSalesExpenseChart(chart) {
  const data = new google.visualization.DataTable();
  data.addColumn('string', 'Month');
  data.addColumn('number', 'Sales');
  data.addColumn('number', 'Expenses');

  for (let i = 0; i < chart.months.length; i++) {
    data.addRow([
      chart.months[i],
      chart.sales[i] || 0,
      chart.expenses[i] || 0
    ]);
  }

  const options = {
    title: 'Sales vs Expenses',
    height: 300,
    colors: ['#2F8BCC', '#FF6B6B']
  };

  new google.visualization.ColumnChart(document.getElementById("salesExpenseChart")).draw(data, options);
}

function formatCurrency(value) {
  return "₱" + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function styleReportHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rows = doc.querySelectorAll("tr");

  const styleMap = {
    "net sales": "highlight-net-sales",
    "FOOD & BEVERAGES PURCHASES": "section-label",
    "gross income": "highlight-gross-income",
    "FIXED EXPENSE": "section-label",
    "total fixed expense": "highlight-total",
    "LABOR": "section-label",
    "total labor expense": "highlight-total",
    "OPERATING EXPENSE": "section-label",
    "total operating expense": "highlight-total",
    "MISCELLANEOUS EXPENSES": "section-label",
    "total misc expense": "highlight-total",
    "TOTAL EXPENSES (CASHOUT)": "highlight-total-expenses",
    "NET CASH FLOW FROM OPERATIONS": "highlight-net-cash-flow"
  };

  rows.forEach((tr, index) => {
    if (index === 0) return;
    const label = (tr.cells[0]?.textContent || "").toLowerCase().trim();
    for (const key in styleMap) {
      if (label.includes(key.toLowerCase())) {
        tr.classList.add(styleMap[key]);
        break;
      }
    }
  });

  return doc.body.innerHTML;
}

function exportFilteredReportToPDF() {
  const { year, month, category } = getFilters();
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://script.google.com/macros/s/YOUR_DEPLOYED_URL/exec";
  form.target = "_blank";

  const mode = document.createElement("input");
  mode.type = "hidden";
  mode.name = "mode";
  mode.value = "exportPdf";

  const y = document.createElement("input");
  y.type = "hidden";
  y.name = "year";
  y.value = year;

  const m = document.createElement("input");
  m.type = "hidden";
  m.name = "month";
  m.value = month;

  const c = document.createElement("input");
  c.type = "hidden";
  c.name = "category";
  c.value = category;

  form.appendChild(mode);
  form.appendChild(y);
  form.appendChild(m);
  form.appendChild(c);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
