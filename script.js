document.addEventListener("DOMContentLoaded", function () {
  const btnDashboard = document.getElementById("btnDashboard");
  const btnPL = document.getElementById("btnPL");
  const btnReport = document.getElementById("btnReport");

  const dashboardSection = document.getElementById("dashboard");
  const plSection = document.getElementById("plSection");
  const reportSection = document.getElementById("reportSection");

  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");

  const showSection = (section) => {
    dashboardSection.style.display = "none";
    plSection.style.display = "none";
    reportSection.style.display = "none";
    section.style.display = "block";
  };

  btnDashboard.addEventListener("click", () => {
    showSection(dashboardSection);
    loadDashboard();
  });

  btnPL.addEventListener("click", () => {
    showSection(plSection);
    loadPLTable();
  });

  btnReport.addEventListener("click", () => {
    showSection(reportSection);
    loadReportTable();
  });

  function init() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2020; y--) {
      const option = document.createElement("option");
      option.value = y;
      option.text = y;
      yearSelect.appendChild(option);
    }

    yearSelect.value = currentYear;
    monthSelect.value = "all";

    showSection(dashboardSection);
    loadDashboard();
  }

  yearSelect.addEventListener("change", loadDashboard);
  monthSelect.addEventListener("change", loadDashboard);

  function loadDashboard() {
    const year = yearSelect.value;
    const month = monthSelect.value;

    fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`)
      .then(res => res.json())
      .then(data => {
        const kpis = data.kpis;
        document.getElementById("salesKPI").innerText = `₱${kpis.totalSales.toLocaleString()}`;
        document.getElementById("expensesKPI").innerText = `₱${kpis.totalExpenses.toLocaleString()}`;
        document.getElementById("revenueKPI").innerText = `₱${kpis.revenue.toLocaleString()}`;
        document.getElementById("cashoutKPI").innerText = `₱${kpis.cashout.toLocaleString()}`;

        drawExpenseChart(data.expenseChart);
        drawSalesExpenseChart(data.salesExpense);
      })
      .catch(err => {
        console.error("Dashboard data fetch failed:", err);
      });
  }

  function drawExpenseChart(data) {
    const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
    if (window.expenseChart) window.expenseChart.destroy();

    const datasets = data.groups.map(group => ({
      label: group.name,
      data: group.values,
      backgroundColor: group.color
    }));

    window.expenseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.months,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          datalabels: {
            formatter: val => `${val}%`,
            color: "#333",
            anchor: "end",
            align: "top"
          },
          legend: {
            position: "top"
          },
          title: {
            display: true,
            text: "Expense % of Sales"
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => val + '%'
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function drawSalesExpenseChart(data) {
    const ctx = document.getElementById("sales-expense-chart").getContext("2d");
    if (window.salesExpenseChart) window.salesExpenseChart.destroy();

    window.salesExpenseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.months,
        datasets: [
          {
            label: "Sales",
            data: data.sales,
            backgroundColor: "#4b49ac"
          },
          {
            label: "Expenses",
            data: data.expenses,
            backgroundColor: "#ff6b6b"
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: {
            display: true,
            text: "Monthly Sales vs Expenses"
          }
        }
      }
    });
  }

  function loadPLTable() {
    // Optional: implement if needed
    document.getElementById("plTable").innerHTML = "P&L Table coming soon.";
  }

  function loadReportTable() {
    const year = yearSelect.value;
    const month = monthSelect.value;

    fetch(`https://https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("reportContainer").innerHTML = data.reportHTML;
      })
      .catch(err => {
        console.error("Report fetch failed:", err);
      });
  }

  window.exportToPDF = function () {
    const element = document.getElementById("reportContainer");
    const opt = {
      margin: 0.5,
      filename: `sales_expense_report_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  window.emailReport = function () {
    fetch('https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=email')
      .then(res => res.text())
      .then(res => {
        alert("Report email sent.");
      })
      .catch(err => {
        console.error("Email report failed:", err);
        alert("Failed to send email.");
      });
  };

  init();
});
