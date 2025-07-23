document.addEventListener("DOMContentLoaded", function () {
  const dashboardBtn = document.getElementById("btnDashboard");
  const plBtn = document.getElementById("btnPL");
  const reportBtn = document.getElementById("btnReport");

  const dashboardSection = document.getElementById("dashboard");
  const plSection = document.getElementById("plSection");
  const reportSection = document.getElementById("reportSection");

  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");

  dashboardBtn.addEventListener("click", showDashboard);
  plBtn.addEventListener("click", showPL);
  reportBtn.addEventListener("click", showReport);

  function showDashboard() {
    dashboardSection.style.display = "block";
    plSection.style.display = "none";
    reportSection.style.display = "none";
    loadDashboard();
  }

  function showPL() {
    dashboardSection.style.display = "none";
    plSection.style.display = "block";
    reportSection.style.display = "none";
    // Load P&L if needed
  }

  function showReport() {
    dashboardSection.style.display = "none";
    plSection.style.display = "none";
    reportSection.style.display = "block";
    loadReport();
  }

  // Initialize year dropdown
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
  yearSelect.value = currentYear;

  monthSelect.value = "all";

  yearSelect.addEventListener("change", loadDashboard);
  monthSelect.addEventListener("change", loadDashboard);

  async function loadDashboard() {
    const year = yearSelect.value;
    const month = monthSelect.value;

    const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      // KPIs
      document.getElementById("salesKPI").innerText = "₱" + data.kpis.totalSales.toLocaleString();
      document.getElementById("expensesKPI").innerText = "₱" + data.kpis.totalExpenses.toLocaleString();
      document.getElementById("revenueKPI").innerText = "₱" + data.kpis.revenue.toLocaleString();
      document.getElementById("cashoutKPI").innerText = "₱" + data.kpis.cashout.toLocaleString();

      drawExpenseChart(data.expenseChart);
      drawSalesExpenseChart(data.salesExpense);
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
    }
  }

  function drawExpenseChart(data) {
    const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
    if (window.expenseChartInstance) window.expenseChartInstance.destroy();

    const datasets = data.groups.map(group => ({
      label: group.name,
      data: group.values,
      backgroundColor: group.color
    }));

    window.expenseChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.months,
        datasets: datasets
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Expense % of Sales"
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
            }
          },
          datalabels: {
            formatter: (value) => value.toFixed(1) + "%",
            anchor: "end",
            align: "top",
            color: "#333"
          }
        },
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: val => val + "%"
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function drawSalesExpenseChart(data) {
    const ctx = document.getElementById("sales-expense-chart").getContext("2d");
    if (window.salesExpenseInstance) window.salesExpenseInstance.destroy();

    window.salesExpenseInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.months,
        datasets: [
          {
            label: "Sales",
            data: data.sales,
            backgroundColor: "#2F8BCC"
          },
          {
            label: "Expenses",
            data: data.expenses,
            backgroundColor: "#FFB64D"
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Sales vs Expenses"
          },
          datalabels: {
            formatter: (value) => "₱" + value.toLocaleString(),
            anchor: "end",
            align: "top",
            color: "#333"
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  async function loadReport() {
    const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      document.getElementById("reportContainer").innerHTML = data.reportHTML;
    } catch (err) {
      console.error("Failed to load report:", err);
      document.getElementById("reportContainer").innerText = "Failed to load report.";
    }
  }

  // === Export / Email buttons ===
  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export to PDF";
  exportBtn.className = "button";
  exportBtn.style.marginTop = "20px";
  exportBtn.onclick = () => {
    window.open("https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=pdf", "_blank");
  };

  const emailBtn = document.createElement("button");
  emailBtn.textContent = "Email this Report";
  emailBtn.className = "button";
  emailBtn.style.marginLeft = "10px";
  emailBtn.onclick = async () => {
    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=email");
      const msg = await res.text();
      alert("Report email sent successfully!");
    } catch (err) {
      console.error("Failed to send email:", err);
      alert("Failed to send email.");
    }
  };

  // Append buttons to reportSection
  document.getElementById("reportSection").appendChild(exportBtn);
  document.getElementById("reportSection").appendChild(emailBtn);

  // Initial load
  showDashboard();
});
