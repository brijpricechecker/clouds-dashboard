const ctxGrouped = document.getElementById("grouped-expense-chart").getContext("2d");
const ctxSales = document.getElementById("sales-expense-chart").getContext("2d");

let groupedChart, salesChart;

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

function fetchData() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data || !data.monthlySales) return;

      document.getElementById("salesKPI").textContent = formatPeso(data.totalSales || 0);
      document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses || 0);
      document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue || 0);

      drawGroupedExpenseChart(data, category);
      drawSalesVsExpenseChart(data);
      buildPnLTable(data.pnlData || []);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function drawGroupedExpenseChart(data, selectedCategory) {
  const monthly = data.monthlyCategoryTotals;
  const monthlySales = data.monthlySales;

  const months = monthOrder.filter(m => monthly[m]);
  const categories = selectedCategory === 'all'
    ? ["foodandbeveragespurchases", "fixedexpense", "laborexpense", "operatingexpense", "misc"]
    : [selectedCategory];

  const colors = ["#b3e5fc", "#c8e6c9", "#fff9c4", "#d1c4e9", "#f8bbd0"];

  const datasets = categories.map((cat, i) => ({
    label: categoryLabel(cat),
    data: months.map(m => {
      const amt = (monthly[m] && monthly[m][cat]) || 0;
      const sale = monthlySales[m] || 0;
      return sale > 0 ? (amt / sale) * 100 : 0;
    }),
    backgroundColor: colors[i % colors.length],
    datalabels: {
      color: '#000',
      anchor: 'end',
      align: 'top',
      formatter: v => v.toFixed(1) + "%"
    }
  }));

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctxGrouped, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Monthly Expenses as % of Revenue",
          font: { size: 16 }
        },
        legend: {
          display: categories.length > 1,
          position: 'bottom'
        },
        datalabels: {
          display: true
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          max: 60,
          title: {
            display: true,
            text: "% of Revenue"
          },
          grid: { display: false }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesVsExpenseChart(data) {
  const months = monthOrder.filter(m => data.monthlySales[m] || data.monthlyExpenseTotals[m]);
  const sales = months.map(m => data.monthlySales[m] || 0);
  const expenses = months.map(m => data.monthlyExpenseTotals[m] || 0);

  if (salesChart) salesChart.destroy();

  salesChart = new Chart(ctxSales, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [
        {
          label: "Sales",
          data: sales,
          backgroundColor: "#81c784"
        },
        {
          label: "Expenses",
          data: expenses,
          backgroundColor: "#ef9a9a"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Sales vs Expenses"
        },
        legend: { position: 'bottom' }
      },
      scales: {
        x: { stacked: false },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount (₱)"
          }
        }
      }
    }
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

function downloadPDF() {
  const doc = new jspdf.jsPDF('p', 'pt', 'a4');
  html2canvas(document.querySelector(".charts")).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    doc.save("dashboard.pdf");
  });
}

// Event Listeners

document.addEventListener("DOMContentLoaded", () => {
  // Default year to latest year
  const yearSelect = document.getElementById("yearSelect");
  if (yearSelect) {
    const currentYear = new Date().getFullYear();
    [...yearSelect.options].forEach(option => {
      option.selected = option.value == currentYear;
    });
  }

  fetchData();
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categoryFilter").addEventListener("change", fetchData);
  document.getElementById("downloadBtn").addEventListener("click", downloadPDF);

  document.getElementById("showPnlBtn").addEventListener("click", () => {
    document.querySelector(".charts").style.display = "none";
    document.getElementById("pnlView").style.display = "block";
    document.getElementById("backBtn").style.display = "block";
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    document.querySelector(".charts").style.display = "flex";
    document.getElementById("pnlView").style.display = "none";
    document.getElementById("backBtn").style.display = "none";
  });
});
