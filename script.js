document.addEventListener("DOMContentLoaded", function () {
  const dashboardBtn = document.getElementById("btnDashboard");
  const plBtn = document.getElementById("btnPL");
  const reportBtn = document.getElementById("btnReport");

  const dashboard = document.getElementById("dashboard");
  const plSection = document.getElementById("plSection");
  const reportSection = document.getElementById("reportSection");

  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");

  const deployedWebAppUrl = 'https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec'; // Update this!

  dashboardBtn.addEventListener("click", showDashboard);
  plBtn.addEventListener("click", () => showSection(plSection));
  reportBtn.addEventListener("click", () => showSection(reportSection));

  function showDashboard() {
    showSection(dashboard);
    loadDashboard();
  }

  function showSection(section) {
    [dashboard, plSection, reportSection].forEach(sec => sec.style.display = "none");
    section.style.display = "block";
  }

  function populateYearDropdown() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
      const option = document.createElement("option");
      option.value = y;
      option.textContent = y;
      if (y === currentYear) option.selected = true;
      yearSelect.appendChild(option);
    }
  }

  function loadDashboard() {
    const year = yearSelect.value;
    const month = monthSelect.value;

    fetch(`${deployedWebAppUrl}?year=${year}&month=${month}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("salesKPI").innerText = `₱${formatNumber(data.kpis.totalSales)}`;
        document.getElementById("expensesKPI").innerText = `₱${formatNumber(data.kpis.totalExpenses)}`;
        document.getElementById("revenueKPI").innerText = `₱${formatNumber(data.kpis.revenue)}`;
        document.getElementById("cashoutKPI").innerText = `₱${formatNumber(data.kpis.cashout)}`;

        drawExpenseChart(data.expenseChart);
        drawSalesExpenseChart(data.salesExpense);

        document.getElementById("reportContainer").innerHTML = data.reportHTML;

        setupExportButtons(data.reportHTML);
      })
      .catch(err => console.error("Dashboard data fetch failed:", err));
  }

  function formatNumber(n) {
    return parseFloat(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function drawExpenseChart(data) {
    const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
    if (window.expenseChartObj) window.expenseChartObj.destroy();

    const datasets = data.groups.map(group => ({
      label: group.name,
      backgroundColor: group.color,
      data: group.values
    }));

    window.expenseChartObj = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.months,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'top',
            formatter: val => `${val.toFixed(0)}%`,
            color: '#333',
            font: { weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: context => `${context.dataset.label}: ${context.raw.toFixed(0)}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => `${val}%`
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function drawSalesExpenseChart(data) {
    const ctx = document.getElementById("sales-expense-chart").getContext("2d");
    if (window.salesChartObj) window.salesChartObj.destroy();

    window.salesChartObj = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.months,
        datasets: [
          {
            label: "Sales",
            backgroundColor: "#4B49AC",
            data: data.sales
          },
          {
            label: "Expenses",
            backgroundColor: "#FF7C7C",
            data: data.expenses
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'top',
            formatter: val => `₱${formatNumber(val)}`,
            color: '#444'
          },
          tooltip: {
            callbacks: {
              label: context => `${context.dataset.label}: ₱${formatNumber(context.raw)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => `₱${val.toLocaleString()}`
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function setupExportButtons(reportHTML) {
    let existingExport = document.getElementById("exportBtn");
    let existingEmail = document.getElementById("emailBtn");

    if (!existingExport) {
      const exportBtn = document.createElement("button");
      exportBtn.id = "exportBtn";
      exportBtn.innerText = "Download PDF";
      exportBtn.style.marginRight = "10px";
      exportBtn.addEventListener("click", () => downloadPDF(reportHTML));
      document.getElementById("reportSection").prepend(exportBtn);
    }

    if (!existingEmail) {
      const emailBtn = document.createElement("button");
      emailBtn.id = "emailBtn";
      emailBtn.innerText = "Email This Report";
      emailBtn.addEventListener("click", sendReportEmail);
      document.getElementById("reportSection").prepend(emailBtn);
    }
  }

  function downloadPDF(html) {
    fetch(`${deployedWebAppUrl}?action=downloadPDF&html=${encodeURIComponent(html)}`)
      .then(res => res.text())
      .then(base64 => {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${base64}`;
        link.download = "Sales_and_Expense_Report.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(err => console.error("PDF download failed:", err));
  }

  function sendReportEmail() {
    fetch(`${deployedWebAppUrl}?action=sendReportEmail`)
      .then(res => res.text())
      .then(msg => alert(msg))
      .catch(err => alert("Email failed: " + err));
  }

  populateYearDropdown();
  showDashboard();

  yearSelect.addEventListener("change", loadDashboard);
  monthSelect.addEventListener("change", loadDashboard);
});
