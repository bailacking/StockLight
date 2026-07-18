var sortKey = null;
var sortDir = "asc";
var pageSize = 100;
var currentPage = 1;

function debounce(fn, delay) {
  var timer = null;
  return function() {
    var args = arguments;
    var ctx = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
}

var debouncedRenderTable = debounce(function() { renderTable(); }, 300);

var _lastFilterKey = "";
var _lastSortKey = null;
var _lastSortDir = "asc";

function getFilterKey(f) {
  return JSON.stringify(f);
}

function setSort(key) {
  if (sortKey === key) {
    sortDir = sortDir === "asc" ? "desc" : "asc";
  } else {
    sortKey = key;
    sortDir = "asc";
  }
  renderTable();
}

function getFilterValues() {
  var f = {};
  f.search = (document.getElementById("searchInput")?.value || "").trim();
  f.pctchgMin = parseFloat(document.getElementById("pctchgMin")?.value) || null;
  f.pctchgMax = parseFloat(document.getElementById("pctchgMax")?.value) || null;
  f.volumeMin = parseFloat(document.getElementById("volumeMin")?.value) || null;
  f.volumeMax = parseFloat(document.getElementById("volumeMax")?.value) || null;
  f.closeMin = parseFloat(document.getElementById("closeMin")?.value) || null;
  f.closeMax = parseFloat(document.getElementById("closeMax")?.value) || null;
  f.volumeRatioMin = parseFloat(document.getElementById("volumeRatioMin")?.value) || null;
  f.volumeRatioMax = parseFloat(document.getElementById("volumeRatioMax")?.value) || null;
  f.turnoverRateMin = parseFloat(document.getElementById("turnoverRateMin")?.value) || null;
  f.turnoverRateMax = parseFloat(document.getElementById("turnoverRateMax")?.value) || null;
  f.peMin = parseFloat(document.getElementById("peMin")?.value) || null;
  f.peMax = parseFloat(document.getElementById("peMax")?.value) || null;
  f.pbMin = parseFloat(document.getElementById("pbMin")?.value) || null;
  f.pbMax = parseFloat(document.getElementById("pbMax")?.value) || null;
  f.marketCapMin = parseFloat(document.getElementById("marketCapMin")?.value) || null;
  f.marketCapMax = parseFloat(document.getElementById("marketCapMax")?.value) || null;
  f.amplitudeMin = parseFloat(document.getElementById("amplitudeMin")?.value) || null;
  f.amplitudeMax = parseFloat(document.getElementById("amplitudeMax")?.value) || null;
  return f;
}

function filterStocks(stocks, f) {
  return stocks.filter(function(s) {
    if (f.search) {
      var q = f.search.toLowerCase();
      if (s.code.indexOf(q) === -1 && (s.name || "").toLowerCase().indexOf(q) === -1) return false;
    }
    if (f.pctchgMin !== null && (s.pctchg === null || s.pctchg === undefined || s.pctchg < f.pctchgMin)) return false;
    if (f.pctchgMax !== null && (s.pctchg === null || s.pctchg === undefined || s.pctchg > f.pctchgMax)) return false;
    if (f.volumeMin !== null && (s.volume === null || s.volume < f.volumeMin)) return false;
    if (f.volumeMax !== null && (s.volume === null || s.volume > f.volumeMax)) return false;
    if (f.closeMin !== null && (s.close === null || s.close < f.closeMin)) return false;
    if (f.closeMax !== null && (s.close === null || s.close > f.closeMax)) return false;
    if (f.volumeRatioMin !== null && (s.volume_ratio === null || s.volume_ratio < f.volumeRatioMin)) return false;
    if (f.volumeRatioMax !== null && (s.volume_ratio === null || s.volume_ratio > f.volumeRatioMax)) return false;
    if (f.turnoverRateMin !== null && (s.turnover_rate === null || s.turnover_rate < f.turnoverRateMin)) return false;
    if (f.turnoverRateMax !== null && (s.turnover_rate === null || s.turnover_rate > f.turnoverRateMax)) return false;
    if (f.peMin !== null && (s.pe_ttm === null || s.pe_ttm < f.peMin)) return false;
    if (f.peMax !== null && (s.pe_ttm === null || s.pe_ttm > f.peMax)) return false;
    if (f.pbMin !== null && (s.pb === null || s.pb < f.pbMin)) return false;
    if (f.pbMax !== null && (s.pb === null || s.pb > f.pbMax)) return false;
    if (f.marketCapMin !== null && (s.market_cap === null || s.market_cap < f.marketCapMin)) return false;
    if (f.marketCapMax !== null && (s.market_cap === null || s.market_cap > f.marketCapMax)) return false;
    if (f.amplitudeMin !== null && (s.amplitude === null || s.amplitude < f.amplitudeMin)) return false;
    if (f.amplitudeMax !== null && (s.amplitude === null || s.amplitude > f.amplitudeMax)) return false;
    return true;
  });
}

function sortStocks(stocks, key, dir) {
  if (!key) return stocks;
  return stocks.slice().sort(function(a, b) {
    var va = a[key], vb = b[key];
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    if (typeof va === "string") {
      return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return dir === "asc" ? va - vb : vb - va;
  });
}

function resetFilters() {
  var inputs = document.querySelectorAll(".filter-group input, #searchInput");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].value = "";
  }
  sortKey = null;
  sortDir = "asc";
  currentPage = 1;
  _lastFilterKey = "";
  _lastSortKey = null;
  _lastSortDir = "asc";
  renderTable();
}

function toggleMoreFilters() {
  var el = document.getElementById("filterMore");
  el.classList.toggle("show");
}

function changePageSize() {
  pageSize = parseInt(document.getElementById("pageSizeSelect").value);
  currentPage = 1;
  renderTable();
}

function goPage(delta) {
  var total = window._sortedData ? window._sortedData.length : 0;
  var maxPage = Math.max(1, Math.ceil(total / pageSize));
  currentPage = Math.max(1, Math.min(maxPage, currentPage + delta));
  renderTable();
}

function goFirst() { currentPage = 1; renderTable(); }

function goLast() {
  var total = window._sortedData ? window._sortedData.length : 0;
  currentPage = Math.max(1, Math.ceil(total / pageSize));
  renderTable();
}

function goToPage(page) {
  currentPage = page;
  renderTable();
}

function updateSortIcons() {
  var keys = ["code", "name", "latest_date", "open", "high", "low", "close", "pctchg",
    "volume", "volume_ratio", "amplitude", "turnover_rate", "realtime_amount",
    "market_cap", "float_market_cap", "pe_ttm", "pb"];
  for (var i = 0; i < keys.length; i++) {
    var el = document.getElementById("sort-" + keys[i]);
    if (!el) continue;
    var isActive = keys[i] === sortKey;
    var ascActive = isActive && sortDir === "asc";
    var descActive = isActive && sortDir === "desc";
    el.innerHTML = '<span class="arrow ' + (ascActive ? "active" : "") + '">&#9650;</span><span class="arrow ' + (descActive ? "active" : "") + '">&#9660;</span>';
    var th = el.parentNode;
    if (isActive) th.classList.add("sorted");
    else th.classList.remove("sorted");
  }
}

function renderTable() {
  var stocks = window._stockData;
  if (!stocks) return;

  var f = getFilterValues();
  var filterKey = getFilterKey(f);
  if (filterKey !== _lastFilterKey || sortKey !== _lastSortKey || sortDir !== _lastSortDir) {
    var filtered = filterStocks(stocks, f);
    var sorted = sortStocks(filtered, sortKey, sortDir);
    window._sortedData = sorted;
    _lastFilterKey = filterKey;
    _lastSortKey = sortKey;
    _lastSortDir = sortDir;
  }
  var sorted = window._sortedData;

  var total = sorted.length;
  var maxPage = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage > maxPage) currentPage = maxPage;

  var start = (currentPage - 1) * pageSize;
  var end = Math.min(start + pageSize, total);
  var pageData = sorted.slice(start, end);

  var tbody = document.getElementById("stockTbody");
  var countEl = document.getElementById("resultCount");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var firstBtn = document.getElementById("firstBtn");
  var lastBtn = document.getElementById("lastBtn");
  var pageNumEl = document.getElementById("pageNumbers");

  if (!total) {
    tbody.innerHTML = '<tr><td colspan="17" style="text-align:center;padding:30px;color:#999;">暂无符合条件的股票</td></tr>';
    if (countEl) countEl.textContent = "0 / " + stocks.length;
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (firstBtn) firstBtn.disabled = true;
    if (lastBtn) lastBtn.disabled = true;
    if (pageNumEl) pageNumEl.innerHTML = "";
    updateSortIcons();
    return;
  }

  var from = (currentPage - 1) * pageSize + 1;
  var to = Math.min(currentPage * pageSize, total);
  if (countEl) countEl.textContent = "显示第 " + from + "-" + to + " 条，共 " + total + " 条";
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= maxPage;
  if (firstBtn) firstBtn.disabled = currentPage <= 1;
  if (lastBtn) lastBtn.disabled = currentPage >= maxPage;

  if (pageNumEl) {
    var html = "";
    var maxVisible = 9;
    var half = Math.floor(maxVisible / 2);
    var pStart = Math.max(1, currentPage - half);
    var pEnd = Math.min(maxPage, pStart + maxVisible - 1);
    if (pEnd - pStart + 1 < maxVisible) {
      pStart = Math.max(1, pEnd - maxVisible + 1);
    }
    if (pStart > 1) {
      html += '<button onclick="goToPage(1)">1</button>';
      if (pStart > 2) html += '<span style="padding:0 4px;color:#ccc;">…</span>';
    }
    for (var p = pStart; p <= pEnd; p++) {
      html += '<button onclick="goToPage(' + p + ')" class="' + (p === currentPage ? 'current' : '') + '">' + p + '</button>';
    }
    if (pEnd < maxPage) {
      if (pEnd < maxPage - 1) html += '<span style="padding:0 4px;color:#ccc;">…</span>';
      html += '<button onclick="goToPage(' + maxPage + ')">' + maxPage + '</button>';
    }
    pageNumEl.innerHTML = html;
  }

  var html = "";
  var globalStart = (currentPage - 1) * pageSize;
  for (var i = 0; i < pageData.length; i++) {
    var s = pageData[i];
    var pctClass = s.pctchg > 0 ? "up" : (s.pctchg < 0 ? "down" : "");
    var globalIdx = globalStart + i;
    var prevCode = globalIdx > 0 ? sorted[globalIdx - 1].code : "";
    var nextCode = globalIdx < sorted.length - 1 ? sorted[globalIdx + 1].code : "";
    var link = 'detail.html?code=' + s.code;
    if (prevCode) link += '&prev=' + prevCode;
    if (nextCode) link += '&next=' + nextCode;
    html += '<tr class="' + pctClass + '">';
    html += '<td><a href="' + link + '">' + escHtml(s.code) + '</a></td>';
    html += '<td class="name-cell"><a href="' + link + '">' + escHtml(s.name || "-") + '</a></td>';
    html += '<td>' + escHtml(s.latest_date || "-") + '</td>';
    html += '<td>' + formatPrice(s.open) + '</td>';
    html += '<td>' + formatPrice(s.high) + '</td>';
    html += '<td>' + formatPrice(s.low) + '</td>';
    html += '<td>' + formatPrice(s.close) + '</td>';
    html += '<td class="pctchg">' + formatPercent(s.pctchg) + '</td>';
    html += '<td>' + formatVolume(s.volume) + '</td>';
    html += '<td>' + formatCompact(s.volume_ratio) + '</td>';
    html += '<td>' + formatPercent(s.amplitude) + '</td>';
    html += '<td>' + formatPercent(s.turnover_rate) + '</td>';
    html += '<td>' + formatAmount(s.realtime_amount) + '</td>';
    html += '<td>' + formatCompact(s.market_cap) + '</td>';
    html += '<td>' + formatCompact(s.float_market_cap) + '</td>';
    html += '<td>' + formatCompact(s.pe_ttm) + '</td>';
    html += '<td>' + formatCompact(s.pb) + '</td>';
    html += '</tr>';
  }
  tbody.innerHTML = html;
  updateSortIcons();
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", function() {
  var inputs = document.querySelectorAll(".filter-group input, #searchInput");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("input", function() { currentPage = 1; debouncedRenderTable(); });
  }
});
