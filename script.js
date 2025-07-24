document.addEventListener("DOMContentLoaded", function () {
  const dashboard = document.getElementById("dashboard");
  const plSection = document.getElementById("plSection");
  const reportSection = document.getElementById("reportSection");
  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");

  // === Navigation ===
  document.getElementById("btnDashboard").addEventListener("click", showDashboard);
  document.getElementById("btnPL").addEventListener("click", () => toggleSection(plSection));
  document.getElementById("btnReport").addEventListener("click", () => toggleSection(reportSection));

  function toggleSection(sectionToShow) {
    [dashboard, plSection, reportSection].forEach(section => section.style.display = "none");
    sectionToShow.style.display = "block";
  }

  function showDashboard() {
    toggleSection(dashboard);
    loadDashboard();
  }

  // === Populate Year Dropdown ===
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2023; y--) {
    const option = document.createElement("option");
    option.value = y;
    option.text = y;
    yearSelect.appendChild(option);
  }
  yearSelect.value = currentYear;

  // === Load Data ===
  yearSelect.addEventListener("change", loadDashboard);
  monthSelect.addEventListener("change", loadDashboard);
  showDashboard();

  function loadDashboard() {
    const year = yearSelect.value;
    const month = monthSelect.value;

    fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("salesKPI").innerText = "₱" + data.kpis.totalSales.toLocaleString();
        document.getElementById("expensesKPI").innerText = "₱" + data.kpis.totalExpenses.toLocaleString();
        document.getElementById("revenueKPI").innerText = "₱" + data.kpis.revenue.toLocaleString();
        document.getElementById("cashoutKPI").innerText = "₱" + data.kpis.cashout.toLocaleString();

        drawExpenseChart(data.expenseChart);
        drawSalesExpenseChart(data.salesExpense);

        document.getElementById("reportContainer").innerHTML = data.reportHTML;

        attachReportButtons(); // ensure buttons are only added once
      })
      .catch(err => {
        console.error("Dashboard data fetch failed:", err);
      });
  }

  function drawExpenseChart(data) {
    const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
    if (window.expenseChartObj) window.expenseChartObj.destroy();

    const datasets = data.groups.map(group => ({
      label: group.name,
      backgroundColor: group.color,
      data: group.values.map(v => (v / 100).toFixed(4)) // Convert to decimal for stacked bar, display as %
    }));

    window.expenseChartObj = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.months,
        datasets
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(0)}%`
            }
          },
          datalabels: {
            formatter: val => `${(val * 100).toFixed(0)}%`,
            color: "#333"
          }
        },
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => `${(value * 100).toFixed(0)}%`
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function drawSalesExpenseChart(data) {
    const ctx = document.getElementById("sales-expense-chart").getContext("2d");
    if (window.salesExpenseChartObj) window.salesExpenseChartObj.destroy();

    window.salesExpenseChartObj = new Chart(ctx, {
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
            backgroundColor: "#f85c70"
          }
        ]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ₱${Number(ctx.raw).toLocaleString()}`
            }
          }
        },
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => "₱" + Number(value).toLocaleString()
            }
          }
        }
      }
    });
  }

  function attachReportButtons() {
    if (document.getElementById("pdfDownloadBtn")) return;

    const container = document.getElementById("reportContainer");
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "10px";

    const pdfBtn = document.createElement("button");
    pdfBtn.innerText = "Export to PDF";
    pdfBtn.className = "btn";
    pdfBtn.id = "pdfDownloadBtn";
    pdfBtn.style.marginRight = "10px";

    const emailBtn = document.createElement("button");
    emailBtn.innerText = "Email this Report";
    emailBtn.className = "btn";
    emailBtn.id = "emailReportBtn";

    wrapper.appendChild(pdfBtn);
    wrapper.appendChild(emailBtn);
    container.parentNode.insertBefore(wrapper, container);

    // === PDF Export ===
    pdfBtn.addEventListener("click", () => {
      const element = document.getElementById("reportContainer");
      const opt = {
        margin: 0.5,
        filename: `Sales_and_Expense_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().from(element).set(opt).save();
    });

    // === Email Report ===
    emailBtn.addEventListener("click", () => {
      fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=email`, {
        method: 'POST'
      })
        .then(res => res.text())
        .then(msg => alert(msg))
        .catch(err => {
          console.error("Failed to send email:", err);
          alert("Failed to send report email.");
        });
    });
  }
});
