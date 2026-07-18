function formatCompact(val) {
  if (val === null || val === undefined || val === "") return "-";
  var num = Number(val);
  if (isNaN(num)) return "-";
  var abs = Math.abs(num);
  if (abs >= 1e8) return (num / 1e8).toFixed(2) + "亿";
  if (abs >= 1e4) return (num / 1e4).toFixed(2) + "万";
  return num.toFixed(2);
}

function formatAmount(val) {
  if (val === null || val === undefined || val === "") return "-";
  var num = Number(val);
  if (isNaN(num)) return "-";
  var abs = Math.abs(num);
  if (abs >= 1e8) return (num / 1e8).toFixed(2) + "亿";
  if (abs >= 1e4) return (num / 1e4).toFixed(2) + "万";
  return num.toFixed(0);
}

function formatPercent(val) {
  if (val === null || val === undefined || val === "") return "-";
  var num = Number(val);
  if (isNaN(num)) return "-";
  return num.toFixed(2) + "%";
}

function formatPrice(val) {
  if (val === null || val === undefined || val === "") return "-";
  var num = Number(val);
  if (isNaN(num)) return "-";
  return num.toFixed(2);
}

function formatVolume(val) {
  if (val === null || val === undefined || val === "") return "-";
  var num = Number(val);
  if (isNaN(num)) return "-";
  if (num >= 1e8) return (num / 1e8).toFixed(2) + "亿";
  if (num >= 1e4) return (num / 1e4).toFixed(2) + "万";
  return num.toFixed(0);
}

function pctClass(val) {
  if (val === null || val === undefined || val === "") return "";
  var num = Number(val);
  if (isNaN(num)) return "";
  if (num > 0) return "up-color";
  if (num < 0) return "down-color";
  return "";
}
