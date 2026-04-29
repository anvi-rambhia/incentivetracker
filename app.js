import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔥 YOUR FIREBASE CONFIG (UNCHANGED)
const firebaseConfig = {
  apiKey: "AIzaSyBT6Mf4GfKMGuasdPp6ZmY2MwyKX41EoPA",
  authDomain: "dailytracker-2026.firebaseapp.com",
  projectId: "dailytracker-2026",
  storageBucket: "dailytracker-2026.firebasestorage.app",
  messagingSenderId: "977139174808",
  appId: "1:977139174808:web:a999a51a07f038aa886fed",
  measurementId: "G-ST402T3BB5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



// 🔐 AUTH STATE (MERGED LOGIN SYSTEM)
onAuthStateChanged(auth, async (user) => {

  document.body.style.display = "block";

  const loginSection = document.getElementById("loginSection");
  const appSection = document.getElementById("appSection");

  if (!user) {
    loginSection.style.display = "block";
    appSection.style.display = "none";
    return;
  }

  loginSection.style.display = "none";
  appSection.style.display = "block";

  console.log("User logged in:", user.email);

  const formSection = document.getElementById("formSection");
  const dashboardSection = document.getElementById("dashboardSection");

  let role = "promoter";

  try {
    const users = await getDocs(collection(db, "users"));
    users.forEach(doc => {
      if (doc.data().email === user.email) {
        role = doc.data().role;
      }
    });
  } catch (e) {
    console.log("Role fetch error:", e);
  }

  console.log("ROLE:", role);

  if (role === "manager") {
    formSection.style.display = "none";
    dashboardSection.style.display = "block";
    loadDashboard();
  } else {
    formSection.style.display = "block";
    dashboardSection.style.display = "none";
  }

  // SET TODAY DATE
  const entryDate = document.getElementById("entryDate");
  if (entryDate) {
    entryDate.value = new Date().toISOString().split("T")[0];
  }

  const filterDate = document.getElementById("filterDate");
  if (filterDate) {
    filterDate.value = new Date().toISOString().split("T")[0];
  }
});



// 🔑 LOGIN
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert(e.message);
  }
};



// 🆕 REGISTER (DEFAULT PROMOTER)
window.register = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    await addDoc(collection(db, "users"), {
      email,
      role: "promoter"
    });

    alert("User created as promoter");
  } catch (e) {
    alert(e.message);
  }
};



// 🚪 LOGOUT
window.logout = function () {
  signOut(auth);
};



// ➕ ADD ENTRY (UNCHANGED LOGIC)
window.addSale = async function () {

  const user = auth.currentUser;

  const entryDate = document.getElementById("entryDate").value;

  const sale = document.getElementById("sale").value;
  const brand = document.getElementById("brand").value;
  const value = document.getElementById("value").value;

  const accSale = document.getElementById("accSale").value;
  const accName = document.getElementById("accName").value;
  const accValue = document.getElementById("accValue").value;

  const review = document.getElementById("review").value;
  const photo = document.getElementById("photo").value;
  const instagram = document.getElementById("instagram").value;
  const contact = document.getElementById("contact").value;

  const today = new Date().toISOString().split("T")[0];

  if (!entryDate || entryDate !== today) {
    alert("❌ Only today's entry allowed");
    return;
  }

  if (
    !sale ||
    !accSale ||
    !review || review === "Select" ||
    !photo || photo === "Select" ||
    !instagram || instagram === "Select" ||
    !contact || contact === "Select"
  ) {
    alert("⚠️ All fields must be selected (Yes/No)");
    return;
  }

  if (sale === "Yes") {
    if (!brand) {
      alert("⚠️ Select mobile brand");
      return;
    }
    if (!value || Number(value) <= 0) {
      alert("⚠️ Enter valid mobile value");
      return;
    }
  }

  if (accSale === "Yes") {
    if (!accName) {
      alert("⚠️ Select accessory name");
      return;
    }
    if (!accValue || Number(accValue) <= 0) {
      alert("⚠️ Enter valid accessory value");
      return;
    }
  }

  try {
    await addDoc(collection(db, "sales"), {
      promoter: user.email,
      date: entryDate,

      sale,
      brand: sale === "Yes" ? brand : "",
      value: sale === "Yes" ? Number(value) : 0,

      accSale,
      accName: accSale === "Yes" ? accName : "",
      accValue: accSale === "Yes" ? Number(accValue) : 0,

      review,
      photo,
      instagram,
      contact
    });

    alert("✅ Entry Saved Successfully");

  } catch (e) {
    console.log(e);
    alert("❌ Error saving data");
  }
};

// 📊 DASHBOARD (UNCHANGED)

window.loadDashboard = async function () {

  const snapshot = await getDocs(collection(db, "sales"));
  const tableBody = document.getElementById("tableBody");
  const summaryTableBody = document.getElementById("summaryTableBody");

  let dataMap = {};
  let monthlyTotals = {};

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 📊 COLLECT DATA
  snapshot.forEach(doc => {

    const d = doc.data();
    if (!d.date) return;

    const entryDate = new Date(d.date);

    if (
      entryDate.getMonth() !== currentMonth ||
      entryDate.getFullYear() !== currentYear
    ) return;

    const key = `${d.promoter}_${d.date}`;

    if (!dataMap[key]) {
      dataMap[key] = {
        promoter: d.promoter,
        date: d.date,
        qty: 0,
        value: 0,
        accValue: 0,
        review: 0,
        photo: 0,
        instagram: 0,
        contact: 0
      };
    }

    // DAILY DATA
    if (d.sale === "Yes") {
      dataMap[key].qty += 1;
      dataMap[key].value += Number(d.value || 0);
    }

    if (d.accSale === "Yes") {
      dataMap[key].accValue += Number(d.accValue || 0);
    }

    if (d.review === "Yes") dataMap[key].review++;
    if (d.photo === "Yes") dataMap[key].photo++;
    if (d.instagram === "Yes") dataMap[key].instagram++;
    if (d.contact === "Yes") dataMap[key].contact++;

    // MONTHLY TOTALS
    if (!monthlyTotals[d.promoter]) {
      monthlyTotals[d.promoter] = {
        sales: 0,
        review: 0,
        photo: 0,
        instagram: 0,
        contact: 0
      };
    }

    if (d.sale === "Yes") monthlyTotals[d.promoter].sales++;
    if (d.review === "Yes") monthlyTotals[d.promoter].review++;
    if (d.photo === "Yes") monthlyTotals[d.promoter].photo++;
    if (d.instagram === "Yes") monthlyTotals[d.promoter].instagram++;
    if (d.contact === "Yes") monthlyTotals[d.promoter].contact++;
  });

  // 🎯 TARGETS
  const targets = {
    sales: 60,
    review: 75,
    photo: 30,
    instagram: 50,
    contact: 75
  };

  let promoterSummary = {};

  // 💰 INCENTIVE CALCULATION
  for (let p in monthlyTotals) {

    const t = monthlyTotals[p];

    const percent = {
      sales: (t.sales / targets.sales) * 100,
      review: (t.review / targets.review) * 100,
      photo: (t.photo / targets.photo) * 100,
      instagram: (t.instagram / targets.instagram) * 100,
      contact: (t.contact / targets.contact) * 100
    };

    let completed = 0;

    if (percent.sales >= 80) completed++;
    if (percent.review >= 80) completed++;
    if (percent.photo >= 100) completed++;
    if (percent.instagram >= 100) completed++;
    if (percent.contact >= 100) completed++;

    let eligible = completed >= 3;

    let totalIncentive = 0;

    if (eligible) {

      // 📱 SALES
      let rateSales = 0;
      if (percent.sales > 100) rateSales = 120;
      else if (percent.sales === 100) rateSales = 100;
      else if (percent.sales >= 91) rateSales = 80;
      else if (percent.sales >= 80) rateSales = 60;

      totalIncentive += rateSales * t.sales;

      // ⭐ REVIEW
      let rateReview = 0;
      if (percent.review > 100) rateReview = 12;
      else if (percent.review === 100) rateReview = 10;
      else if (percent.review >= 80) rateReview = 5;

      totalIncentive += rateReview * t.review;

      // 📸 PHOTO
      if (percent.photo >= 100) {
        let ratePhoto = percent.photo > 100 ? 18 : 15;
        totalIncentive += ratePhoto * t.photo;
      }

      // 📷 INSTAGRAM
      if (percent.instagram >= 100) {
        let rateInsta = percent.instagram > 100 ? 18 : 15;
        totalIncentive += rateInsta * t.instagram;
      }

      // 📞 CONTACT
      if (percent.contact >= 100) {
        let rateContact = percent.contact > 100 ? 7 : 5;
        totalIncentive += rateContact * t.contact;
      }
    }

    promoterSummary[p] = {
      totalQty: t.sales,
      incentive: totalIncentive,
      eligible: eligible
    };
  }

  // 📋 DAILY TABLE
  let rows = Object.values(dataMap);
  rows.sort((a, b) => new Date(b.date) - new Date(a.date));

  let html = "";

  rows.forEach(d => {
    html += `
      <tr>
        <td>${d.promoter}</td>
        <td>${d.date}</td>
        <td>${d.qty}</td>
        <td>₹${d.value}</td>
        <td>₹${d.accValue}</td>
        <td>${d.review}</td>
        <td>${d.photo}</td>
        <td>${d.instagram}</td>
        <td>${d.contact}</td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;

  // 📊 SUMMARY TABLE
  let summaryHTML = "";

  for (let p in promoterSummary) {
    const s = promoterSummary[p];

    summaryHTML += `
      <tr>
        <td>${p}</td>
        <td>${s.totalQty}</td>
        <td>${s.eligible ? "YES" : "NO"}</td>
        <td>₹${s.incentive}</td>
      </tr>
    `;
  }

  summaryTableBody.innerHTML = summaryHTML;
};



// UI TOGGLES
window.toggleMobile = function () {
  const sale = document.getElementById("sale").value;
  document.getElementById("mobileSection").style.display =
    (sale === "Yes") ? "block" : "none";
};

window.toggleAccessory = function () {
  const accSale = document.getElementById("accSale").value;
  document.getElementById("accessorySection").style.display =
    (accSale === "Yes") ? "block" : "none";
};