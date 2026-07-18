var _stockData = null;
var CACHE_KEY = "sl_summary";
var CACHE_TTL = 1800000;

function cacheLoad() {
  try {
    var raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    var entry = JSON.parse(raw);
    if (Date.now() - entry.t < CACHE_TTL) return entry.d;
    return null;
  } catch(e) { return null; }
}

function cacheSave(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({t: Date.now(), d: data})); }
  catch(e) {}
}

function renderData(data) {
  var el = document.getElementById("loadingMsg");
  var errorEl = document.getElementById("errorMsg");
  var tableEl = document.getElementById("tableWrap");
  var statusEl = document.getElementById("statusBar");
  if (!data.stocks || !data.stocks.length) {
    if (el) el.style.display = "none";
    if (errorEl) { document.getElementById("errorText").textContent = "暂无股票数据"; errorEl.style.display = "block"; }
    return;
  }
  window._stockData = data.stocks;
  if (el) el.style.display = "none";
  if (errorEl) errorEl.style.display = "none";
  if (tableEl) tableEl.style.display = "block";
  if (statusEl) {
    statusEl.textContent = "共 " + data.count + " 只股票，更新时间: " + (data.generated_at || "");
  }
  renderTable();
}

function loadData() {
  var cached = cacheLoad();
  if (cached) {
    renderData(cached);
  }

  var xhr = new XMLHttpRequest();
  xhr.open("GET", "data/summary.json" + (cached ? "?_=" + Date.now() : ""), true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      try {
        var data = JSON.parse(xhr.responseText);
        if (data.stocks && data.stocks.length) {
          cacheSave(data);
          renderData(data);
        }
      } catch(e) {
        showError("数据解析失败");
      }
    } else if (xhr.status !== 0) {
      showError("数据文件未生成或无法读取");
    }
  };
  xhr.send();
}

function showError(msg) {
  var el = document.getElementById("loadingMsg");
  var tableEl = document.getElementById("tableWrap");
  var errorEl = document.getElementById("errorMsg");
  if (el) el.style.display = "none";
  if (tableEl) tableEl.style.display = "none";
  if (errorEl) {
    document.getElementById("errorText").textContent = msg;
    errorEl.style.display = "block";
  }
}

function retryLoad() {
  document.getElementById("errorMsg").style.display = "none";
  document.getElementById("loadingMsg").style.display = "block";
  loadData();
}

// Auto-refresh: poll every 120s while visible, refresh on tab focus
var REFRESH_INTERVAL = 120000;
var refreshTimer = null;

function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(function() { loadData(); }, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

document.addEventListener("visibilitychange", function() {
  if (document.visibilityState === "visible") { loadData(); startAutoRefresh(); }
  else { stopAutoRefresh(); }
});

window.addEventListener("focus", function() { loadData(); });

document.addEventListener("DOMContentLoaded", function() {
  var icon = document.getElementById("themeIcon");
  if (icon) {
    var theme = document.documentElement.getAttribute("data-theme");
    icon.textContent = theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
  }
  loadData();
  startAutoRefresh();
});

window.addEventListener("scroll", function() {
  var btn = document.getElementById("backToTop");
  if (btn) btn.style.display = window.scrollY > 500 ? "flex" : "none";
});
