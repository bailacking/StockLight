var chart = null;

function getQueryParam(name) {
  var match = location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function loadDetail() {
  var code = getQueryParam("code");
  if (!code) {
    document.body.innerHTML = '<div class="container"><div class="error" style="display:block;">缺少股票代码参数</div></div>';
    return;
  }

  var el = document.getElementById("loadingMsg");
  var contentEl = document.getElementById("detailContent");
  var errorEl = document.getElementById("errorMsg");

  var prevCode = getQueryParam("prev");
  var nextCode = getQueryParam("next");
  setupNav(prevCode, nextCode);

  var xhr = new XMLHttpRequest();
  xhr.open("GET", "data/kline/" + code + ".json", true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      try {
        var data = JSON.parse(xhr.responseText);
        if (el) el.style.display = "none";
        if (contentEl) contentEl.style.display = "block";
        renderDetail(data);
      } catch (e) {
        showError("数据加载失败");
      }
    } else {
      showError("数据文件未生成或无法读取");
    }
  };
  xhr.send();
}

function showError(msg) {
  var el = document.getElementById("loadingMsg");
  var contentEl = document.getElementById("detailContent");
  var errorEl = document.getElementById("errorMsg");
  if (el) el.style.display = "none";
  if (contentEl) contentEl.style.display = "none";
  if (errorEl) {
    document.getElementById("errorText").textContent = msg;
    errorEl.style.display = "block";
  }
}

function retryLoad() {
  document.getElementById("errorMsg").style.display = "none";
  document.getElementById("loadingMsg").style.display = "block";
  loadDetail();
}

function renderDetail(data) {
  var kline = data.kline || [];
  var latest = kline.length > 0 ? kline[kline.length - 1] : null;

  document.getElementById("stockName").textContent = data.name || "-";
  document.getElementById("stockCode").textContent = data.code || "";

  if (latest) {
    var pctColor = latest.pctchg > 0 ? "up-color" : (latest.pctchg < 0 ? "down-color" : "neutral");
    document.getElementById("infoClose").innerHTML = '<span class="value ' + pctColor + '">' + latest.close.toFixed(2) + '</span>';
    document.getElementById("infoPctchg").innerHTML = '<span class="value ' + pctColor + '">' + (latest.pctchg >= 0 ? "+" : "") + latest.pctchg.toFixed(2) + "%</span>";
    document.getElementById("infoDate").textContent = latest.date || "-";
    document.getElementById("infoOpen").textContent = latest.open.toFixed(2);
    document.getElementById("infoHigh").textContent = latest.high.toFixed(2);
    document.getElementById("infoLow").textContent = latest.low.toFixed(2);
    document.getElementById("infoVolume").textContent = formatVolume(latest.volume);
    document.getElementById("infoAmplitude").textContent = latest.amplitude !== null && latest.amplitude !== undefined ? latest.amplitude.toFixed(2) + "%" : "-";
    document.getElementById("infoMa5").textContent = latest.ma5 !== null ? latest.ma5.toFixed(2) : "-";
    document.getElementById("infoMa10").textContent = latest.ma10 !== null ? latest.ma10.toFixed(2) : "-";
    document.getElementById("infoMa20").textContent = latest.ma20 !== null ? latest.ma20.toFixed(2) : "-";
  }

  chart = new KLineChart("klineCanvas", "chartTooltip");
  chart.setData(kline);
}

function setupNav(prev, next) {
  var prevEl = document.getElementById("prevStock");
  var nextEl = document.getElementById("nextStock");
  var cur = getQueryParam("code");
  if (prev && prevEl) {
    prevEl.href = "detail.html?code=" + prev + "&next=" + cur;
    prevEl.style.display = "inline";
  }
  if (next && nextEl) {
    nextEl.href = "detail.html?code=" + next + "&prev=" + cur;
    nextEl.style.display = "inline";
  }
}

window._slThemeChange = function() {
  if (chart) chart.refreshTheme();
};

document.addEventListener("visibilitychange", function() {
  if (document.visibilityState === "visible") { loadDetail(); }
});

window.addEventListener("focus", function() { loadDetail(); });

document.addEventListener("DOMContentLoaded", function() {
  var icon = document.getElementById("themeIcon");
  if (icon) {
    var theme = document.documentElement.getAttribute("data-theme");
    icon.textContent = theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
  }
  loadDetail();
});

window.addEventListener("scroll", function() {
  var btn = document.getElementById("backToTop");
  if (btn) btn.style.display = window.scrollY > 500 ? "flex" : "none";
});
