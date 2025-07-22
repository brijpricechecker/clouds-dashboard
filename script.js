google.charts.load('current', { packages: ['corechart'] });

google.charts.setOnLoadCallback(() => {
  document.getElementById("filterBtn").addEventListener("click", applyFilters);
  document.getElementById("exportPdfBtn").addEventListener("click", exportReportPDF);
  loadDashboard(); // Load default dashboard view
});

function applyFilters() {
  const year = document.getElementById("yearFilter").value;
  const month = document.getElementById("monthFilter").value;
  const category = document.getElementById("categoryFilter").value;

  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}&category=${category}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      drawCharts(data.expenseChart, data.salesExpense);
      updateKpis(data.kpis);
      document.getElementById("reportContainer").innerHTML = styleReportHTML(data.reportHTML);
    })
    .catch(err => console.error("Dashboard data fetch failed:", err));
}

function loadDashboard() {
  applyFilters(); // Load default data using current filter values
}

function updateKpis(kpi) {
  document.getElementById("kpiSales").innerText = kpi.totalSales.toLocaleString();
  document.getElementById("kpiExpenses").innerText = kpi.totalExpenses.toLocaleString();
  document.getElementById("kpiRevenue").innerText = kpi.revenue.toLocaleString();
  document.getElementById("kpiCashout").innerText = kpi.cashout.toLocaleString();
}

function drawCharts(expenseChart, salesExpense) {
  drawExpenseChart(expenseChart);
  drawSalesExpenseChart(salesExpense);
}

function drawExpenseChart(chartData) {
  const data = new google.visualization.DataTable();
  data.addColumn('string', 'Month');
  chartData.groups.forEach(group => {
    data.addColumn('number', group.name);
  });

  chartData.months.forEach((month, i) => {
    const row = [month];
    chartData.groups.forEach(group => {
      row.push(group.values[i] / 100); // Convert to decimal for chart (% display handled in options)
    });
    data.addRow(row);
  });

  const options = {
    title: 'Expenses as % of Sales',
    isStacked: true,
    height: 300,
    legend: { position: 'top' },
    vAxis: {
      format: 'percent',
      minValue: 0
    },
    colors: chartData.groups.map(g => g.color)
  };

  const chart = new google.visualization.ColumnChart(document.getElementById('expenseChart'));
  chart.draw(data, options);
}

function drawSalesExpenseChart(salesExpense) {
  const data = new google.visualization.DataTable();
  data.addColumn('string', 'Month');
  data.addColumn('number', 'Sales');
  data.addColumn('number', 'Expenses');

  salesExpense.months.forEach((month, i) => {
    data.addRow([month, salesExpense.sales[i], salesExpense.expenses[i]]);
  });

  const options = {
    title: 'Sales vs Expenses',
    height: 300,
    legend: { position: 'top' },
    colors: ['#3B8FF3', '#F3797E']
  };

  const chart = new google.visualization.ColumnChart(document.getElementById('salesExpenseChart'));
  chart.draw(data, options);
}

function exportReportPDF() {
  fetch('https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?action=pdf')
    .then(response => response.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Sales_Expense_Report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF.");
    });
}

function styleReportHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('tr');

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
