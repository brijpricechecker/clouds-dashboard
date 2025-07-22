google.charts.load('current', { packages: ['corechart'] });

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

function loadDashboard() {
  const year = document.getElementById('yearFilter')?.value || '2025';
  const month = document.getElementById('monthFilter')?.value || 'ALL';

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      // Update KPIs
      document.getElementById('kpiSales').innerText = formatNumber(data.kpis.totalSales);
      document.getElementById('kpiExpenses').innerText = formatNumber(data.kpis.totalExpenses);
      document.getElementById('kpiRevenue').innerText = formatNumber(data.kpis.revenue);
      document.getElementById('kpiCashout').innerText = formatNumber(data.kpis.cashout);

      drawSalesExpenseChart(data.salesExpense);
      drawExpenseChart(data.expenseChart);
    })
    .catch(err => {
      console.error("Dashboard data fetch failed:", err);
    });
}

function drawSalesExpenseChart(data) {
  const chartData = [['Month', 'Sales', 'Expenses']];
  for (let i = 0; i < data.months.length; i++) {
    chartData.push([
      data.months[i],
      data.sales[i],
      data.expenses[i]
    ]);
  }

  const dataTable = google.visualization.arrayToDataTable(chartData);
  const options = {
    title: 'Sales vs Expenses',
    height: 400,
    colors: ['#2F8BCC', '#FF6B6B'],
    hAxis: { title: 'Month' },
    vAxis: { title: 'Amount' },
    legend: { position: 'top' }
  };

  const chart = new google.visualization.ColumnChart(document.getElementById('salesExpenseChart'));
  chart.draw(dataTable, options);
}

function drawExpenseChart(chartData) {
  const data = new google.visualization.DataTable();
  data.addColumn('string', 'Month');
  chartData.groups.forEach(group => {
    data.addColumn('number', group.name);
  });

  const rows = chartData.months.map((month, idx) => {
    return [
      month,
      ...chartData.groups.map(g => g.values[idx] / 100) // Convert from 18 → 0.18
    ];
  });

  data.addRows(rows);

  const options = {
    title: 'Expenses as % of Sales',
    height: 400,
    isStacked: true,
    vAxis: {
      title: 'Percentage',
      format: 'percent'
    },
    colors: chartData.groups.map(g => g.color)
  };

  const chart = new google.visualization.ColumnChart(document.getElementById('expensePercentChart'));
  chart.draw(data, options);
}

function loadReport() {
  fetch('https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec')
    .then(res => res.json())
    .then(data => {
      const rawHTML = data.reportHTML;
      const styledHTML = styleReportHTML(rawHTML);
      document.getElementById('reportContainer').innerHTML = styledHTML;
    })
    .catch(err => {
      document.getElementById('reportContainer').innerHTML = "Failed to load report.";
      console.error("Error loading report:", err);
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

function formatNumber(num) {
  return Number(num).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

window.addEventListener('load', () => {
  showDashboard();
});
