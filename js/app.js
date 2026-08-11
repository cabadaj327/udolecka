(function () {
  "use strict";

  var WEEKDAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
  var MONTH_LABELS = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
  ];

  var SHIFT_TYPES = [
    { value: "none", label: "Bez směny" },
    { value: "morning", label: "Ráno" },
    { value: "afternoon", label: "Odpoledne" },
    { value: "fullday", label: "Celý den" }
  ];

  var state = {
    employees: [],
    schedules: {},
    currentYear: null,
    currentMonth: null // 0-11
  };

  var activeDayKey = null;

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function formatShiftCount(n) {
    var rounded = Math.round(n * 2) / 2;
    return (rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1)).replace(".", ",");
  }

  function monthKey(year, month) { return year + "-" + pad2(month + 1); }

  function dayKey(year, month, day) {
    return year + "-" + pad2(month + 1) + "-" + pad2(day);
  }

  function uid() {
    return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  firebase.initializeApp(window.FIREBASE_CONFIG);
  var db = firebase.firestore();
  var docRef = db.collection("shiftPlanner").doc("shared");
  var firestoreUnsubscribe = null;

  function defaultEmployees() {
    var list = [];
    for (var i = 1; i <= 10; i++) {
      list.push({ id: uid(), name: "Zaměstnanec " + i });
    }
    return list;
  }

  function attachFirestoreListener() {
    if (firestoreUnsubscribe) return;
    firestoreUnsubscribe = docRef.onSnapshot(function (doc) {
      var data = doc.data();
      // Never auto-save here: a transient/empty snapshot must not overwrite
      // real saved data. The doc only gets created for real on the next
      // explicit user action (save() is called from those handlers).
      if (!data) {
        state.employees = state.employees.length ? state.employees : defaultEmployees();
        state.schedules = state.schedules || {};
      } else {
        state.employees = data.employees || [];
        state.schedules = data.schedules || {};
      }
      var today = new Date();
      if (state.currentYear === null) {
        state.currentYear = today.getFullYear();
        state.currentMonth = today.getMonth();
      }
      renderAll();
    }, function (err) {
      console.error("Chyba synchronizace:", err);
    });
  }

  function detachFirestoreListener() {
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }
  }

  function save() {
    docRef.set({
      employees: state.employees,
      schedules: state.schedules
    });
  }

  function getMonthSchedule() {
    var mk = monthKey(state.currentYear, state.currentMonth);
    if (!state.schedules[mk]) state.schedules[mk] = {};
    return state.schedules[mk];
  }

  function getDayAssignments(dk) {
    var monthSched = getMonthSchedule();
    return monthSched[dk] || {};
  }

  // ---------- rendering ----------

  function renderAll() {
    renderMonthLabel();
    renderEmployeeList();
    renderCalendar();
    renderSummary();
  }

  function renderMonthLabel() {
    document.getElementById("monthLabel").textContent =
      MONTH_LABELS[state.currentMonth] + " " + state.currentYear;
  }

  function renderEmployeeList() {
    var ul = document.getElementById("employeeList");
    ul.innerHTML = "";
    state.employees.forEach(function (emp) {
      var li = document.createElement("li");

      var input = document.createElement("input");
      input.type = "text";
      input.value = emp.name;
      input.maxLength = 40;
      input.addEventListener("change", function () {
        emp.name = input.value.trim() || emp.name;
        save();
        renderCalendar();
        renderSummary();
      });

      var delBtn = document.createElement("button");
      delBtn.textContent = "✕";
      delBtn.title = "Odebrat zaměstnance";
      delBtn.addEventListener("click", function () {
        if (!confirm("Opravdu odebrat zaměstnance \"" + emp.name + "\"? Jeho směny v rozpisu zůstanou uloženy pod jeho ID, ale nebudou se zobrazovat.")) return;
        state.employees = state.employees.filter(function (e) { return e.id !== emp.id; });
        save();
        renderAll();
      });

      li.appendChild(input);
      li.appendChild(delBtn);
      ul.appendChild(li);
    });
  }

  function renderCalendar() {
    var cal = document.getElementById("calendar");
    cal.innerHTML = "";

    WEEKDAY_LABELS.forEach(function (label) {
      var h = document.createElement("div");
      h.className = "weekday-header";
      h.textContent = label;
      cal.appendChild(h);
    });

    var year = state.currentYear;
    var month = state.currentMonth;
    var firstOfMonth = new Date(year, month, 1);
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    // JS getDay(): 0=Sun..6=Sat. Convert to Monday-start index 0=Mon..6=Sun.
    var firstWeekday = (firstOfMonth.getDay() + 6) % 7;

    for (var i = 0; i < firstWeekday; i++) {
      var empty = document.createElement("div");
      empty.className = "day-cell empty";
      cal.appendChild(empty);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var dk = dayKey(year, month, day);
      var cell = document.createElement("div");
      var weekdayIdx = (firstWeekday + day - 1) % 7;
      cell.className = "day-cell" + (weekdayIdx >= 5 ? " weekend" : "");

      var assignments = getDayAssignments(dk);
      var byShift = { morning: [], afternoon: [], fullday: [] };
      Object.keys(assignments).forEach(function (empId) {
        var shift = assignments[empId];
        if (byShift[shift]) {
          var emp = state.employees.find(function (e) { return e.id === empId; });
          if (emp) byShift[shift].push(emp.name);
        }
      });

      var dayTotal = byShift.morning.length * 0.5 + byShift.afternoon.length * 0.5 + byShift.fullday.length;

      var num = document.createElement("div");
      num.className = "day-number";
      num.textContent = dayTotal > 0 ? day + " (" + formatShiftCount(dayTotal) + ")" : day;
      cell.appendChild(num);

      ["morning", "afternoon", "fullday"].forEach(function (shift) {
        var row = document.createElement("div");
        if (byShift[shift].length > 0) {
          row.className = "shift-row " + shift;
          row.textContent = byShift[shift].join(", ");
          row.title = byShift[shift].join(", ");
        } else {
          row.className = "shift-row empty-row";
          row.textContent = "";
        }
        cell.appendChild(row);
      });

      cell.addEventListener("click", function (dkClosure) {
        return function () { openDayModal(dkClosure); };
      }(dk));

      cal.appendChild(cell);
    }
  }

  function renderSummary() {
    var ul = document.getElementById("summaryList");
    ul.innerHTML = "";
    var monthSched = getMonthSchedule();
    var counts = {};
    state.employees.forEach(function (e) { counts[e.id] = 0; });

    Object.keys(monthSched).forEach(function (dk) {
      var dayAssignments = monthSched[dk];
      Object.keys(dayAssignments).forEach(function (empId) {
        if (dayAssignments[empId] !== "none" && counts.hasOwnProperty(empId)) {
          counts[empId]++;
        }
      });
    });

    state.employees.forEach(function (emp) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.textContent = emp.name;
      var count = document.createElement("span");
      count.className = "count";
      count.textContent = counts[emp.id] + " sm.";
      li.appendChild(name);
      li.appendChild(count);
      ul.appendChild(li);
    });
  }

  // ---------- day modal ----------

  function openDayModal(dk) {
    activeDayKey = dk;
    var parts = dk.split("-");
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    document.getElementById("modalDate").textContent =
      d.getDate() + ". " + MONTH_LABELS[d.getMonth()] + " " + d.getFullYear();

    var assignments = getDayAssignments(dk);
    var list = document.getElementById("modalEmployeeList");
    list.innerHTML = "";

    state.employees.forEach(function (emp) {
      var row = document.createElement("div");
      row.className = "modal-employee-row";

      var name = document.createElement("span");
      name.className = "emp-name";
      name.textContent = emp.name;

      var select = document.createElement("select");
      select.dataset.empId = emp.id;
      SHIFT_TYPES.forEach(function (st) {
        var opt = document.createElement("option");
        opt.value = st.value;
        opt.textContent = st.label;
        select.appendChild(opt);
      });
      select.value = assignments[emp.id] || "none";

      row.appendChild(name);
      row.appendChild(select);
      list.appendChild(row);
    });

    document.getElementById("dayModal").classList.remove("hidden");
  }

  function closeDayModal() {
    document.getElementById("dayModal").classList.add("hidden");
    activeDayKey = null;
  }

  function saveDayModal() {
    if (!activeDayKey) return;
    if (!confirm("Opravdu chcete změny uložit?")) return;
    var monthSched = getMonthSchedule();
    var newAssignments = {};
    var selects = document.querySelectorAll("#modalEmployeeList select");
    selects.forEach(function (sel) {
      if (sel.value !== "none") {
        newAssignments[sel.dataset.empId] = sel.value;
      }
    });
    if (Object.keys(newAssignments).length === 0) {
      delete monthSched[activeDayKey];
    } else {
      monthSched[activeDayKey] = newAssignments;
    }
    save();
    closeDayModal();
    renderCalendar();
    renderSummary();
  }

  // ---------- export ----------

  function exportCSV() {
    var year = state.currentYear;
    var month = state.currentMonth;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var rows = [["Datum", "Ráno", "Odpoledne", "Celý den"]];

    for (var day = 1; day <= daysInMonth; day++) {
      var dk = dayKey(year, month, day);
      var assignments = getDayAssignments(dk);
      var byShift = { morning: [], afternoon: [], fullday: [] };
      Object.keys(assignments).forEach(function (empId) {
        var shift = assignments[empId];
        var emp = state.employees.find(function (e) { return e.id === empId; });
        if (emp && byShift[shift]) byShift[shift].push(emp.name);
      });
      rows.push([
        pad2(day) + "." + pad2(month + 1) + "." + year,
        byShift.morning.join("; "),
        byShift.afternoon.join("; "),
        byShift.fullday.join("; ")
      ]);
    }

    var csv = rows.map(function (r) {
      return r.map(function (cell) {
        var s = String(cell).replace(/"/g, '""');
        return /[",;\n]/.test(s) ? '"' + s + '"' : s;
      }).join(",");
    }).join("\n");

    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "smeny_" + monthKey(year, month) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clearMonth() {
    var mk = monthKey(state.currentYear, state.currentMonth);
    if (!confirm("Opravdu vymazat celý rozpis pro " + MONTH_LABELS[state.currentMonth] + " " + state.currentYear + "?")) return;
    delete state.schedules[mk];
    save();
    renderCalendar();
    renderSummary();
  }

  // ---------- events ----------

  function attachEvents() {
    document.getElementById("prevMonth").addEventListener("click", function () {
      state.currentMonth--;
      if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
      renderAll();
    });

    document.getElementById("nextMonth").addEventListener("click", function () {
      state.currentMonth++;
      if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
      renderAll();
    });

    document.getElementById("addEmployeeForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("newEmployeeName");
      var name = input.value.trim();
      if (!name) return;
      state.employees.push({ id: uid(), name: name });
      input.value = "";
      save();
      renderAll();
    });

    document.getElementById("closeModal").addEventListener("click", closeDayModal);
    document.getElementById("saveDay").addEventListener("click", saveDayModal);
    document.getElementById("dayModal").addEventListener("click", function (e) {
      if (e.target.id === "dayModal") closeDayModal();
    });

    document.getElementById("printBtn").addEventListener("click", function () {
      window.print();
    });

    document.getElementById("csvBtn").addEventListener("click", exportCSV);
    document.getElementById("clearMonthBtn").addEventListener("click", clearMonth);
  }

  // ---------- auth ----------

  function showLogin() {
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("appRoot").classList.add("hidden");
    detachFirestoreListener();
  }

  function showApp() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.remove("hidden");
    attachFirestoreListener();
  }

  function attachAuthEvents() {
    document.getElementById("loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var passwordInput = document.getElementById("loginPassword");
      var errorEl = document.getElementById("loginError");
      errorEl.textContent = "";
      firebase.auth().signInWithEmailAndPassword(window.SHARED_LOGIN_EMAIL, passwordInput.value)
        .then(function () {
          passwordInput.value = "";
        })
        .catch(function () {
          errorEl.textContent = "Nesprávné heslo.";
        });
    });

    document.getElementById("logoutBtn").addEventListener("click", function () {
      firebase.auth().signOut();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    attachEvents();
    attachAuthEvents();
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        showApp();
      } else {
        showLogin();
      }
    });
  });
})();
