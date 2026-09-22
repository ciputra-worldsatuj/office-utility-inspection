const GAS_URL = "https://script.google.com/macros/s/AKfycbxR15tT0rsNrwW5apq4QuO5LZob3xC0VGzSUVFNXhysffJalTTnDea3P7bE5CjAw2m8cA/exec";
let db = null;

// KONVERSI MATEMATIK AUTOMATIS
function calcTemp(fId, cId) {
  const valF = parseFloat(document.getElementById(fId).value);
  const targetC = document.getElementById(cId);
  if (!isNaN(valF)) {
    const valC = ((valF - 32) * 5) / 9;
    targetC.value = valC.toFixed(2);
  } else {
    targetC.value = "";
  }
}

function calcPressure(psigId, kpagId) {
  const valPsig = parseFloat(document.getElementById(psigId).value);
  const targetKpag = document.getElementById(kpagId);
  if (!isNaN(valPsig)) {
    const valKpag = valPsig * 6.89476;
    targetKpag.value = valKpag.toFixed(2);
  } else {
    targetKpag.value = "";
  }
}

function toggleSwitch(id) {
  const btn = document.getElementById(id);
  if (btn.classList.contains("off")) {
    btn.classList.remove("off");
    btn.classList.add("on");
    btn.innerText = "ON";
  } else {
    btn.classList.remove("on");
    btn.classList.add("off");
    btn.innerText = "OFF";
  }
}

function toggleUtilityForm() {
  const utilSelect = document.getElementById("utility_id");
  const chillerForm = document.getElementById("chiller-form");
  
  // Munculkan form chiller jika utility yang dipilih = Chiller (U006)
  if (utilSelect.value === "U006" || utilSelect.options[utilSelect.selectedIndex].text.toLowerCase().includes("chiller")) {
    chillerForm.classList.remove("hidden");
  } else {
    chillerForm.classList.add("hidden");
  }
}

// DATABASE LOKAL (IndexedDB)
function initDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open("EngInspectionDB", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("chiller_logs")) {
        db.createObjectStore("chiller_logs", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      updatePendingCount();
      resolve();
    };
  });
}

// FETCH DATA USER & UTILITY
async function loadInitialData() {
  try {
    const res = await fetch(`${GAS_URL}?action=getInitialData`);
    const json = await res.json();
    if (json.status === "SUCCESS") {
      localStorage.setItem("eng_users", JSON.stringify(json.users));
      localStorage.setItem("eng_utilities", JSON.stringify(json.utilities));
      renderDropdowns(json.users, json.utilities);
      return;
    }
  } catch (e) {
    console.log("Offline mode, membaca Master Data dari memori lokal...");
  }

  const cachedUsers = JSON.parse(localStorage.getItem("eng_users") || "[]");
  const cachedUtils = JSON.parse(localStorage.getItem("eng_utilities") || "[]");
  renderDropdowns(cachedUsers, cachedUtils);
}

function renderDropdowns(users, utilities) {
  const selectUser = document.getElementById("petugas");
  const selectUtil = document.getElementById("utility_id");

  selectUser.innerHTML = '<option value="">-- Pilih Petugas --</option>';
  users.forEach(u => selectUser.innerHTML += `<option value="${u.name}">${u.name}</option>`);

  selectUtil.innerHTML = '<option value="">-- Pilih Utility --</option>';
  utilities.forEach(ut => selectUtil.innerHTML += `<option value="${ut.utilityId}">${ut.name} (${ut.category})</option>`);
}

// SIMPAN LOKAL
async function saveChiller(e) {
  e.preventDefault();

  const data = {
    targetSheet: "Chiller",
    timestamp: new Date().toISOString(),
    date: document.getElementById("insp_date").value,
    time: document.getElementById("insp_time").value,
    petugas: document.getElementById("petugas").value,
    unit: document.getElementById("ch_unit").value,
    
    // Evaporator
    leavingWaterTemp: document.getElementById("evap_leaving_f").value,
    leavingWaterCelcius: document.getElementById("evap_leaving_c").value,
    returnWaterTemp: document.getElementById("evap_return_f").value,
    returnWaterCelcius: document.getElementById("evap_return_c").value,
    smallTempDiffr: document.getElementById("evap_small_f").value,
    smallTempDiffrCelc: document.getElementById("evap_small_c").value,
    pressure: document.getElementById("evap_press_psig").value,
    pressureKpag: document.getElementById("evap_press_kpag").value,
    saturation: document.getElementById("evap_sat_f").value,
    saturationCelc: document.getElementById("evap_sat_c").value,
    refrigerantTemp: document.getElementById("evap_refr_f").value,
    refrigerantTempCelc: document.getElementById("evap_refr_c").value,
    waterPressureIn: document.getElementById("evap_wp_in").value,
    waterPressureOut: document.getElementById("evap_wp_out").value,
    approachEvaporator: document.getElementById("evap_approach").value,

    // Condenser
    condenserReturnTemp: document.getElementById("cond_return_f").value,
    condenserReturnTempCelc: document.getElementById("cond_return_c").value,
    condenserLeavingTemp: document.getElementById("cond_leaving_f").value,
    condenserLeavingTempCelc: document.getElementById("cond_leaving_c").value,
    condenserSaturation: document.getElementById("cond_sat_f").value,
    condenserSaturationCelc: document.getElementById("cond_sat_c").value,
    condenserSmallTemp: document.getElementById("cond_small_f").value,
    condenserSmallTempCelc: document.getElementById("cond_small_c").value,
    condenserPressure: document.getElementById("cond_press_psig").value,
    condenserPressurePkag: document.getElementById("cond_press_kpag").value,
    condenserDropLeg: document.getElementById("cond_dropleg_f").value,
    condenserDropLegCelc: document.getElementById("cond_dropleg_c").value,
    subCooling: document.getElementById("cond_subcool_f").value,
    subCoolingCelc: document.getElementById("cond_subcool_c").value,
    levelRefrigrant: document.getElementById("cond_level_refr").value,
    condenserWaterPressureIn: document.getElementById("cond_wp_in").value,
    condenserWaterPressureOut: document.getElementById("cond_wp_out").value,
    approachCondenser: document.getElementById("cond_approach").value,
    dischTemp: document.getElementById("cond_disch_temp").value,
    dischSuperHeat: document.getElementById("cond_disch_superheat").value,
    vgd: document.getElementById("cond_vgd").value,

    // Compressor & Electrical
    oilPressure: document.getElementById("comp_oil_press").value,
    commandFrequency: document.getElementById("comp_freq").value,
    oilTemperature: document.getElementById("comp_oil_temp").value,
    hop: document.getElementById("comp_hop").value,
    lop: document.getElementById("comp_lop").value,
    fullLoadAmpere: document.getElementById("elec_fla").value,
    powerInput: document.getElementById("elec_power").value,
    kwh: document.getElementById("elec_kwh").value,
    voltage: document.getElementById("elec_voltage").value,
    current: document.getElementById("elec_current").value,
    scrTemperature: document.getElementById("elec_scr_temp").value,
    operatingHours: document.getElementById("comp_op_hours").value,
    oilLevel: document.getElementById("comp_oil_level").value,

    // Equipment Status
    motorChwp: document.getElementById("btn_chwp").innerText,
    coolingTower: document.getElementById("btn_ct").innerText,
    condenser: document.getElementById("btn_cond_pump").innerText,
    status: document.getElementById("sys_status").value,
    keterangan: document.getElementById("sys_keterangan").value
  };

  const tx = db.transaction("chiller_logs", "readwrite");
  tx.objectStore("chiller_logs").add(data);
  tx.oncomplete = () => {
    alert("✅ Data Chiller berhasil disimpan di lokal HP!");
    document.getElementById("chiller-form").reset();
    document.getElementById("chiller-form").classList.add("hidden");
    updatePendingCount();
  };
}

function updatePendingCount() {
  const tx = db.transaction("chiller_logs", "readonly");
  const store = tx.objectStore("chiller_logs");
  const req = store.count();
  req.onsuccess = () => {
    document.getElementById("pending-count").innerText = `💾 Data Lokal: ${req.result}`;
  };
}

// SINKRONISASI
async function syncData() {
  const tx = db.transaction("chiller_logs", "readonly");
  const store = tx.objectStore("chiller_logs");
  const req = store.getAll();

  req.onsuccess = async () => {
    const records = req.result;
    if (records.length === 0) {
      alert("Tidak ada data pending yang tersimpan.");
      return;
    }

    let success = 0;
    for (const rec of records) {
      try {
        const res = await fetch(GAS_URL, {
          method: "POST",
          body: JSON.stringify(rec),
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await res.json();
        if (result.status === "SUCCESS") {
          deleteRecord(rec.id);
          success++;
        }
      } catch (e) {}
    }

    alert(`✅ Berhasil menyinkronkan ${success} data ke Spreadsheet!`);
    updatePendingCount();
  };
}

function deleteRecord(id) {
  const tx = db.transaction("chiller_logs", "readwrite");
  tx.objectStore("chiller_logs").delete(id);
}

// INIT DEFAULT DATE/TIME
window.addEventListener("DOMContentLoaded", () => {
  initDB();
  loadInitialData();

  const now = new Date();
  document.getElementById("insp_date").value = now.toISOString().split("T")[0];
  document.getElementById("insp_time").value = now.toTimeString().split(" ")[0].substring(0, 5);
});
