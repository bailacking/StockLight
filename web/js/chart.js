function KLineChart(canvasId, tooltipId) {
  this.canvas = document.getElementById(canvasId);
  this.tooltip = document.getElementById(tooltipId);
  this.ctx = this.canvas.getContext("2d");
  this.data = [];
  this.dpr = window.devicePixelRatio || 1;

  this.margin = { top: 25, right: 60, bottom: 25, left: 55 };
  this.volHeight = 80;
  this.dateLabelH = 20;
  this.scrollbarH = 6;
  this.candleGap = 2;
  this.targetStep = 10;
  this.hoverIndex = -1;
  this.maColors = { ma5: "#f39c12", ma10: "#3498db", ma20: "#2ecc71" };
  this.volMa5Color = "#9b59b6";

  this.scrollPos = 0;
  this.isDragging = false;
  this.dragStartX = 0;
  this.dragStartScroll = 0;
  this.touchStartX = 0;
  this.touchStartScroll = 0;
  this.touchId = null;

  this.loadThemeColors();

  var self = this;
  this.canvas.addEventListener("mousedown", function(e) { self.onMouseDown(e); });
  this.canvas.addEventListener("mousemove", function(e) { self.onMouseMove(e); });
  this.canvas.addEventListener("mouseleave", function() { self.onMouseLeave(); });
  this.canvas.addEventListener("wheel", function(e) { e.preventDefault(); self.onWheel(e); }, { passive: false });
  this.canvas.addEventListener("click", function(e) { self.onClick(e); });
  this.canvas.addEventListener("touchstart", function(e) { self.onTouchStart(e); }, { passive: false });
  this.canvas.addEventListener("touchmove", function(e) { self.onTouchMove(e); }, { passive: false });
  this.canvas.addEventListener("touchend", function(e) { self.onTouchEnd(e); });
  document.addEventListener("mousemove", function(e) { self.onGlobalMouseMove(e); });
  document.addEventListener("mouseup", function(e) { self.onGlobalMouseUp(e); });

  window.addEventListener("resize", function() { self.resize(); });
}

KLineChart.prototype.loadThemeColors = function() {
  var root = document.documentElement;
  var style = getComputedStyle(root);
  this.tc = {
    noData: style.getPropertyValue("--chart-no-data").trim() || "#999",
    candleUp: style.getPropertyValue("--chart-candle-up").trim() || "#ef5350",
    candleDown: style.getPropertyValue("--chart-candle-down").trim() || "#26a69a",
    maLabel: style.getPropertyValue("--chart-ma-label").trim() || "#666",
    axisColor: style.getPropertyValue("--chart-axis-color").trim() || "#999",
    crosshair: style.getPropertyValue("--chart-crosshair").trim() || "rgba(0,0,0,0.3)",
    gridColor: style.getPropertyValue("--chart-grid").trim() || "rgba(0,0,0,0.1)",
    tooltipBg: style.getPropertyValue("--chart-tooltip-bg").trim() || "rgba(0,0,0,.85)",
    tooltipText: style.getPropertyValue("--chart-tooltip-text").trim() || "#fff",
  };
};

KLineChart.prototype.refreshTheme = function() {
  this.loadThemeColors();
  this.resize();
};

KLineChart.prototype.setData = function(data) {
  this.data = data || [];
  this.scrollPos = Infinity;
  this.resize();
};

KLineChart.prototype.resize = function() {
  var rect = this.canvas.getBoundingClientRect();
  var w = rect.width;
  var h = rect.height || 500;
  this.canvas.width = w * this.dpr;
  this.canvas.height = h * this.dpr;
  this.ctx.scale(this.dpr, this.dpr);
  this.W = w;
  this.H = h;
  this.draw();
};

KLineChart.prototype.getLayout = function() {
  var m = this.margin, W = this.W, H = this.H;
  var chartTop = m.top;
  var volBottom = H - m.bottom - this.scrollbarH - 4;
  var volTop = volBottom - this.volHeight;
  var chartBottom = volTop - this.dateLabelH;
  var chartH = chartBottom - chartTop;
  var dateLabelY = chartBottom + 14;
  var scrollbarY = volBottom + 4;
  var plotLeft = m.left;
  var plotRight = W - m.right;
  var plotW = plotRight - plotLeft;
  return { chartTop, chartBottom, chartH, volTop, volBottom, dateLabelY, scrollbarY, plotLeft, plotRight, plotW };
};

KLineChart.prototype.getVisibleWindow = function(plotW) {
  var step = this.targetStep;
  var gap = this.candleGap;
  var candleWidth = step - gap;
  var visibleCount = Math.max(1, Math.floor(plotW / step));
  var total = this.data.length;
  var maxScroll = Math.max(0, total - visibleCount);
  if (this.scrollPos > maxScroll) this.scrollPos = maxScroll;
  if (this.scrollPos < 0) this.scrollPos = 0;
  var end = Math.min(total, this.scrollPos + visibleCount);
  var visibleData = this.data.slice(this.scrollPos, end);
  var stepActual = step;
  var totalW = visibleData.length * stepActual;
  var volH_real = 0; // filled in draw
  return { step: stepActual, candleWidth, visibleCount: visibleData.length, maxScroll, visibleData, totalW, volH_real: 0 };
};

KLineChart.prototype.niceStep = function(range, targetTicks) {
  var rough = range / targetTicks;
  var mag = Math.pow(10, Math.floor(Math.log10(rough)));
  var norm = rough / mag;
  var nice;
  if (norm <= 1.5) nice = 1;
  else if (norm <= 3.5) nice = 2;
  else if (norm <= 7.5) nice = 5;
  else nice = 10;
  return nice * mag;
};

KLineChart.prototype.draw = function() {
  var ctx = this.ctx;
  var data = this.data;
  var W = this.W, H = this.H;
  ctx.clearRect(0, 0, W, H);

  if (!data || data.length < 2) {
    ctx.fillStyle = this.tc.noData;
    ctx.font = "15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("暂无足够数据", W / 2, H / 2);
    return;
  }

  var L = this.getLayout();
  var V = this.getVisibleWindow(L.plotW);
  var step = V.step;
  var candleWidth = V.candleWidth;
  var visibleData = V.visibleData;
  var visibleCount = V.visibleCount;
  var maxScroll = V.maxScroll;

  var offsetX = L.plotLeft + (L.plotW - V.totalW) / 2;
  if (offsetX < L.plotLeft) offsetX = L.plotLeft;

  var self = this;

  // --- Compute price/volume range from visible data ---
  var maxPrice = -Infinity, minPrice = Infinity, maxVol = 0;
  for (var i = 0; i < visibleCount; i++) {
    var k = visibleData[i];
    if (k.high > maxPrice) maxPrice = k.high;
    if (k.low < minPrice) minPrice = k.low;
    if (k.volume > maxVol) maxVol = k.volume;
  }
  var priceRange = maxPrice - minPrice;
  if (priceRange === 0) priceRange = 1;
  var pricePadding = priceRange * 0.08;
  var yTop = maxPrice + pricePadding;
  var yBottom = minPrice - pricePadding;
  var yRange = yTop - yBottom;

  var volH_real = L.volBottom - L.volTop;
  V.volH_real = volH_real;

  function yPos(price) { return L.chartTop + (yTop - price) / yRange * L.chartH; }
  function volPos(v) { return L.volTop + (1 - v / maxVol) * volH_real; }

  // ========== LAYER 1: Frame + Grid (below content) ==========
  // Border box
  ctx.strokeStyle = this.tc.crosshair;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(L.plotLeft, L.chartTop); ctx.lineTo(L.plotRight, L.chartTop); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L.plotRight, L.chartTop); ctx.lineTo(L.plotRight, L.chartBottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L.plotLeft, L.chartBottom); ctx.lineTo(L.plotRight, L.chartBottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L.plotLeft, L.chartTop); ctx.lineTo(L.plotLeft, L.chartBottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L.plotLeft, L.volTop); ctx.lineTo(L.plotRight, L.volTop); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L.plotRight, L.volTop); ctx.lineTo(L.plotRight, L.volBottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L.plotLeft, L.volBottom); ctx.lineTo(L.plotRight, L.volBottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L.plotLeft, L.volTop); ctx.lineTo(L.plotLeft, L.volBottom); ctx.stroke();

  // Y-axis grid lines (horizontal)
  var priceStep = this.niceStep(yTop - yBottom, 8);
  var p = Math.ceil(yBottom / priceStep) * priceStep;
  while (p <= yTop) {
    var y = yPos(p);
    if (y >= L.chartTop && y <= L.chartBottom) {
      ctx.strokeStyle = this.tc.gridColor;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(L.plotLeft, y); ctx.lineTo(L.plotRight, y); ctx.stroke();
      ctx.setLineDash([]);
    }
    p += priceStep;
  }

  // X-axis grid lines (vertical, at label positions)
  var firstYear = -1, prevYear = -1, prevMonth = -1;
  var lastLabelX = -Infinity;
  var minLabelGap = 40;
  var firstDt = new Date(visibleData[0].date);
  var lastDt = new Date(visibleData[visibleCount - 1].date);
  var totalDays = (lastDt - firstDt) / 86400000;

  for (var i = 0; i < visibleCount; i++) {
    var parts = visibleData[i].date.split("-");
    var year = parseInt(parts[0]), month = parseInt(parts[1]), day = parseInt(parts[2]);
    var x = offsetX + i * step + candleWidth / 2;
    if (x < L.plotLeft || x > L.plotRight) continue;
    if (firstYear < 0) firstYear = year;
    var isMonthBoundary = month !== prevMonth && prevMonth >= 0;
    var isYearBoundary = year !== prevYear && prevYear >= 0;

    if (isMonthBoundary) {
      ctx.strokeStyle = isYearBoundary ? "rgba(128,128,128,0.35)" : "rgba(128,128,128,0.2)";
      ctx.lineWidth = isYearBoundary ? 1.5 : 1;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x, L.chartTop); ctx.lineTo(x, L.volBottom); ctx.stroke();
    }

    var showLabel = false;
    if (totalDays > 730) showLabel = isYearBoundary || (month === 1 && day <= 3);
    else if (totalDays > 180) showLabel = isMonthBoundary;
    else if (totalDays > 60) showLabel = isMonthBoundary || (i % Math.max(1, Math.floor(visibleCount / 14)) === 0);
    else showLabel = (i % Math.max(1, Math.floor(visibleCount / 8)) === 0);
    if (showLabel && x - lastLabelX < minLabelGap) showLabel = false;

    if (showLabel) {
      ctx.strokeStyle = this.tc.gridColor;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x, L.chartTop); ctx.lineTo(x, L.chartBottom); ctx.stroke();
      ctx.setLineDash([]);
      lastLabelX = x;
    }
    prevMonth = month;
    prevYear = year;
  }

  // ========== LAYER 2: Candles + Volume + MA ==========
  function drawCandle(i, color) {
    var k = visibleData[i];
    var x = offsetX + i * step;
    var o = yPos(k.open), c = yPos(k.close), h = yPos(k.high), l = yPos(k.low);
    var t = Math.min(o, c), b = Math.max(o, c);
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + candleWidth / 2, h); ctx.lineTo(x + candleWidth / 2, l); ctx.stroke();
    ctx.fillStyle = color;
    if (Math.abs(c - o) < 1) { ctx.fillRect(x, t - 1, candleWidth, 2); }
    else { ctx.fillRect(x, t, candleWidth, Math.max(1, b - t)); }
  }

  function drawVolBar(i, color) {
    var k = visibleData[i];
    var x = offsetX + i * step;
    var v = k.volume || 0;
    var hh = volPos(v);
    ctx.fillStyle = color;
    ctx.fillRect(x, hh, candleWidth, Math.max(1, L.volBottom - hh));
  }

  for (var i = 0; i < visibleCount; i++) {
    var k = visibleData[i];
    var color = k.close >= k.open ? this.tc.candleUp : this.tc.candleDown;
    drawCandle(i, color);
    drawVolBar(i, color);
  }

  function drawMA(field, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath();
    var started = false;
    for (var i = 0; i < visibleCount; i++) {
      var v = visibleData[i][field];
      if (v === null || v === undefined) { started = false; continue; }
      var x = offsetX + i * step + candleWidth / 2;
      var y = yPos(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else { ctx.lineTo(x, y); }
    }
    ctx.stroke();
  }

  drawMA("ma5", this.maColors.ma5);
  drawMA("ma10", this.maColors.ma10);
  drawMA("ma20", this.maColors.ma20);

  if (visibleData[0].vol_ma5 !== undefined) {
    ctx.strokeStyle = this.volMa5Color; ctx.lineWidth = 1; ctx.beginPath();
    var started = false;
    for (var i = 0; i < visibleCount; i++) {
      var v = visibleData[i].vol_ma5;
      if (v === null || v === undefined) { started = false; continue; }
      if (v > maxVol) continue;
      var x = offsetX + i * step + candleWidth / 2;
      var y = volPos(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else { ctx.lineTo(x, y); }
    }
    ctx.stroke();
  }

  // MA legend overlay
  var legendX = L.plotLeft + 8, legendY = L.chartTop + 8;
  var maFields = [
    { label: "MA5", color: this.maColors.ma5 },
    { label: "MA10", color: this.maColors.ma10 },
    { label: "MA20", color: this.maColors.ma20 },
  ];
  if (visibleData[0].vol_ma5 !== undefined) maFields.push({ label: "VOL5", color: this.volMa5Color });
  var legendW = 96, legendH = 14 * maFields.length + 8;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath(); ctx.roundRect(legendX, legendY, legendW, legendH, 4); ctx.fill();
  var ly = legendY + 12;
  for (var mi = 0; mi < maFields.length; mi++) {
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = "11px sans-serif";
    ctx.fillText(maFields[mi].label, legendX + 8, ly);
    ctx.fillStyle = maFields[mi].color;
    ctx.fillRect(legendX + 44, ly - 5, 14, 2);
    ly += 14;
  }

  // ========== LAYER 3: Labels (above content) ==========
  function formatPriceLabel(val, step) {
    if (step >= 1) return val.toFixed(0);
    if (step >= 0.1) return val.toFixed(1);
    if (step >= 0.01) return val.toFixed(2);
    return val.toFixed(3);
  }

  // Reference price for percentage axis
  var refPrice = visibleData[0].close;
  p = Math.ceil(yBottom / priceStep) * priceStep;
  while (p <= yTop) {
    var y = yPos(p);
    if (y >= L.chartTop && y <= L.chartBottom) {
      // Price label (left)
      ctx.textAlign = "right"; ctx.font = "10px sans-serif"; ctx.fillStyle = this.tc.axisColor;
      ctx.fillText(formatPriceLabel(p, priceStep), L.plotLeft - 6, y + 3);
      // Percentage label (right)
      var pct = (p - refPrice) / refPrice * 100;
      var pctStr = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
      ctx.textAlign = "left"; ctx.font = "9px sans-serif"; ctx.fillStyle = this.tc.axisColor;
      ctx.fillText(pctStr, L.plotRight + 6, y + 3);
    }
    p += priceStep;
  }

  // X-axis date labels
  prevYear = -1; prevMonth = -1; lastLabelX = -Infinity;
  for (var i = 0; i < visibleCount; i++) {
    var parts = visibleData[i].date.split("-");
    var year = parseInt(parts[0]), month = parseInt(parts[1]), day = parseInt(parts[2]);
    var x = offsetX + i * step + candleWidth / 2;
    if (x < L.plotLeft || x > L.plotRight) continue;
    if (firstYear < 0) firstYear = year;
    var isMonthBoundary = month !== prevMonth && prevMonth >= 0;
    var isYearBoundary = year !== prevYear && prevYear >= 0;

    var showLabel = false;
    if (totalDays > 730) showLabel = isYearBoundary || (month === 1 && day <= 3);
    else if (totalDays > 180) showLabel = isMonthBoundary;
    else if (totalDays > 60) showLabel = isMonthBoundary || (i % Math.max(1, Math.floor(visibleCount / 14)) === 0);
    else showLabel = (i % Math.max(1, Math.floor(visibleCount / 8)) === 0);
    if (showLabel && x - lastLabelX < minLabelGap) showLabel = false;

    if (showLabel) {
      var label = (isYearBoundary || year !== firstYear) ? year + "-" + (month < 10 ? "0" : "") + month : month + "月" + day + "日";
      ctx.textAlign = "center"; ctx.font = "10px sans-serif"; ctx.fillStyle = this.tc.axisColor;
      ctx.fillText(label, x, L.dateLabelY);
      lastLabelX = x;
    }
    prevMonth = month;
    prevYear = year;
  }

  // Volume Y-axis labels (outside right border)
  var volStep = this.niceStep(maxVol, 4);
  ctx.textAlign = "left"; ctx.font = "9px sans-serif"; ctx.fillStyle = this.tc.axisColor;
  var vp = 0;
  while (vp <= maxVol) {
    var vy = L.volTop + (1 - vp / maxVol) * volH_real;
    if (vy >= L.volTop && vy <= L.volBottom) {
      ctx.fillText(formatVolumeCompact(vp), L.plotRight + 4, vy + 3);
    }
    if (vp === 0) vp += volStep; else vp += volStep;
  }

  // ========== LAYER 4: Scrollbar ==========
  if (maxScroll > 0) {
    var sbLeft = L.plotLeft, sbW = L.plotRight - L.plotLeft;
    var thumbW = Math.max(16, sbW * visibleCount / this.data.length);
    // Track
    ctx.fillStyle = "rgba(128,128,128,0.12)";
    ctx.beginPath(); ctx.roundRect(sbLeft, L.scrollbarY, sbW, this.scrollbarH, 3); ctx.fill();
    // Thumb
    var thumbX = sbLeft + (sbW - thumbW) * (this.scrollPos / maxScroll);
    ctx.fillStyle = "rgba(128,128,128,0.45)";
    ctx.beginPath(); ctx.roundRect(thumbX, L.scrollbarY, thumbW, this.scrollbarH, 3); ctx.fill();
  }

  // ========== LAYER 5: Crosshair ==========
  if (this.hoverIndex >= 0 && this.hoverIndex < visibleCount) {
    var hi = this.hoverIndex;
    var hx = offsetX + hi * step + candleWidth / 2;
    var hy = yPos(visibleData[hi].close);

    ctx.strokeStyle = this.tc.crosshair; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(hx, L.chartTop); ctx.lineTo(hx, L.chartBottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(L.plotLeft, hy); ctx.lineTo(L.plotRight, hy); ctx.stroke();
    ctx.setLineDash([]);

    // Price label (right edge)
    var priceLabel = visibleData[hi].close.toFixed(2);
    ctx.font = "10px sans-serif";
    var tw = ctx.measureText(priceLabel).width;
    var lx = L.plotRight - tw - 8, ly2 = hy - 8;
    if (ly2 < L.chartTop) ly2 = L.chartTop + 2;
    if (ly2 + 14 > L.chartBottom) ly2 = L.chartBottom - 14;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath(); ctx.roundRect(lx - 2, ly2, tw + 8, 14, 3); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "left";
    ctx.fillText(priceLabel, lx + 2, ly2 + 11);

    // Date label (bottom)
    var dateLabel = visibleData[hi].date;
    var tdw = ctx.measureText(dateLabel).width;
    var dlx = hx - tdw / 2 - 3;
    if (dlx < L.plotLeft) dlx = L.plotLeft + 2;
    if (dlx + tdw + 6 > L.plotRight) dlx = L.plotRight - tdw - 6;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath(); ctx.roundRect(dlx - 2, L.dateLabelY - 13, tdw + 8, 14, 3); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "left";
    ctx.fillText(dateLabel, dlx + 2, L.dateLabelY - 2);
  }
};

KLineChart.prototype.scrollTo = function(pos) {
  var L = this.getLayout();
  var step = this.targetStep;
  var visibleCount = Math.max(1, Math.floor(L.plotW / step));
  var maxScroll = Math.max(0, this.data.length - visibleCount);
  this.scrollPos = Math.max(0, Math.min(maxScroll, Math.round(pos)));
  this.hoverIndex = -1;
  if (this.tooltip) this.tooltip.classList.remove("show");
  this.draw();
};

KLineChart.prototype.updateTooltip = function(index, mx, my) {
  var el = this.tooltip;
  if (!el) return;

  var L = this.getLayout();
  var V = this.getVisibleWindow(L.plotW);
  if (index < 0 || index >= V.visibleCount) { el.classList.remove("show"); return; }

  var k = V.visibleData[index];
  var color = k.close >= k.open ? "up-color" : "down-color";
  el.innerHTML = "<div><strong>" + k.date + "</strong></div>"
    + "<div>开: " + k.open.toFixed(2) + " 高: " + k.high.toFixed(2) + " 低: " + k.low.toFixed(2) + " 收: <span class='" + color + "'>" + k.close.toFixed(2) + "</span></div>"
    + "<div>涨跌幅: <span class='" + color + "'>" + (k.pctchg >= 0 ? "+" : "") + k.pctchg.toFixed(2) + "%</span></div>"
    + "<div>成交量: " + formatVolume(k.volume) + "</div>";
  if (k.ma5 !== null) el.innerHTML += "<div>MA5: " + k.ma5.toFixed(2) + " MA10: " + k.ma10.toFixed(2) + " MA20: " + k.ma20.toFixed(2) + "</div>";

  el.classList.add("show");
  el.style.left = ""; el.style.top = "";
  var wrap = this.canvas.parentElement;
  if (wrap && mx !== undefined && my !== undefined) {
    var wrapRect = wrap.getBoundingClientRect();
    var tW = el.offsetWidth || 220, tH = el.offsetHeight || 80;
    var posX = mx + 15, posY = my - tH / 2;
    if (posX + tW > wrapRect.width - 5) posX = mx - tW - 15;
    if (posY < 0) posY = 0;
    if (posY + tH > wrapRect.height - 5) posY = wrapRect.height - tH - 5;
    el.style.left = posX + "px"; el.style.top = posY + "px";
  }
};

KLineChart.prototype.getHoverIndex = function(mx) {
  var L = this.getLayout();
  var step = this.targetStep;
  var candleWidth = step - this.candleGap;
  var visibleCount = Math.max(1, Math.floor(L.plotW / step));
  var totalW = Math.min(visibleCount, this.data.length) * step;
  var offsetX = L.plotLeft + (L.plotW - totalW) / 2;
  if (offsetX < L.plotLeft) offsetX = L.plotLeft;
  var idx = Math.round((mx - offsetX) / step);
  idx = Math.max(0, Math.min(visibleCount - 1, idx));
  return idx;
};

KLineChart.prototype.getScrollbarHit = function(mx, my) {
  var L = this.getLayout();
  if (my < L.scrollbarY - 3 || my > L.scrollbarY + this.scrollbarH + 3) return -1;
  var sbLeft = L.plotLeft, sbW = L.plotRight - L.plotLeft;
  var step = this.targetStep;
  var visibleCount = Math.max(1, Math.floor(L.plotW / step));
  var maxScroll = Math.max(0, this.data.length - visibleCount);
  if (maxScroll <= 0) return -1;
  var relX = mx - sbLeft;
  var ratio = Math.max(0, Math.min(1, relX / sbW));
  return Math.round(ratio * maxScroll);
};

// --- Event handlers ---
KLineChart.prototype.onMouseDown = function(e) {
  var rect = this.canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left, my = e.clientY - rect.top;
  var hit = this.getScrollbarHit(mx, my);
  if (hit >= 0) {
    this.isDragging = true;
    this.dragStartX = mx;
    this.dragStartScroll = this.scrollPos;
    this.canvas.style.cursor = "grabbing";
  }
};

KLineChart.prototype.onGlobalMouseMove = function(e) {
  if (!this.isDragging) return;
  var rect = this.canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var L = this.getLayout();
  var sbLeft = L.plotLeft, sbW = L.plotRight - L.plotLeft;
  var step = this.targetStep;
  var visibleCount = Math.max(1, Math.floor(L.plotW / step));
  var maxScroll = Math.max(0, this.data.length - visibleCount);
  if (maxScroll <= 0) return;
  var thumbW = Math.max(16, sbW * visibleCount / this.data.length);
  var dragSbW = sbW - thumbW;
  if (dragSbW <= 0) return;
  var dx = mx - this.dragStartX;
  var ratio = dx / dragSbW;
  this.scrollTo(this.dragStartScroll + ratio * maxScroll);
};

KLineChart.prototype.onGlobalMouseUp = function() {
  if (this.isDragging) {
    this.isDragging = false;
    this.canvas.style.cursor = "default";
  }
};

KLineChart.prototype.onMouseMove = function(e) {
  if (this.isDragging) return;
  var rect = this.canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left, my = e.clientY - rect.top;
  var idx = this.getHoverIndex(mx);
  if (idx !== this.hoverIndex) {
    this.hoverIndex = idx;
    this.draw();
    this.updateTooltip(idx, mx, my);
  }
};

KLineChart.prototype.onMouseLeave = function() {
  if (this.isDragging) return;
  this.hoverIndex = -1;
  if (this.tooltip) this.tooltip.classList.remove("show");
  this.draw();
};

KLineChart.prototype.onWheel = function(e) {
  var delta = e.deltaY > 0 ? 3 : -3;
  this.scrollTo(this.scrollPos + delta);
};

KLineChart.prototype.onTouchStart = function(e) {
  var touch = e.changedTouches[0];
  if (!touch) return;
  // Check scrollbar
  var rect = this.canvas.getBoundingClientRect();
  var mx = touch.clientX - rect.left, my = touch.clientY - rect.top;
  var hit = this.getScrollbarHit(mx, my);
  if (hit >= 0) {
    this.isDragging = true;
    this.touchId = touch.identifier;
    this.dragStartX = mx;
    this.dragStartScroll = this.scrollPos;
    return;
  }
  // Chart pan
  this.touchStartX = touch.clientX;
  this.touchStartScroll = this.scrollPos;
  this.touchId = touch.identifier;
};

KLineChart.prototype.onTouchMove = function(e) {
  e.preventDefault();
  var touch = null;
  for (var i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === this.touchId) { touch = e.changedTouches[i]; break; }
  }
  if (!touch) return;
  var rect = this.canvas.getBoundingClientRect();
  var mx = touch.clientX - rect.left;

  if (this.isDragging) {
    // Drag scrollbar
    var L = this.getLayout();
    var sbLeft = L.plotLeft, sbW = L.plotRight - L.plotLeft;
    var step = this.targetStep;
    var visibleCount = Math.max(1, Math.floor(L.plotW / step));
    var maxScroll = Math.max(0, this.data.length - visibleCount);
    if (maxScroll <= 0) return;
    var thumbW = Math.max(16, sbW * visibleCount / this.data.length);
    var dragSbW = sbW - thumbW;
    if (dragSbW <= 0) return;
    var dx = mx - this.dragStartX;
    var ratio = dx / dragSbW;
    this.scrollTo(this.dragStartScroll + ratio * maxScroll);
  } else {
    // Pan chart
    var dx = this.touchStartX - touch.clientX;
    var pxPerStep = this.targetStep;
    var delta = Math.round(dx / pxPerStep);
    if (delta !== 0) {
      this.scrollTo(this.touchStartScroll + delta);
      this.touchStartX = touch.clientX;
      this.touchStartScroll = this.scrollPos;
    }
  }
};

KLineChart.prototype.onClick = function(e) {
  var rect = this.canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left, my = e.clientY - rect.top;
  var idx = this.getHoverIndex(mx);
  this.hoverIndex = idx;
  this.draw();
  this.updateTooltip(idx, mx, my);
};

KLineChart.prototype.onTouchEnd = function(e) {
  this.isDragging = false;
  this.touchId = null;
};

function formatVolumeCompact(val) {
  if (val === null || val === undefined) return "0";
  var num = Number(val);
  if (isNaN(num)) return "0";
  if (num >= 1e8) return (num / 1e8).toFixed(1) + "亿";
  if (num >= 1e4) return (num / 1e4).toFixed(0) + "万";
  return num.toFixed(0);
}
