#!/usr/bin/env python3
"""
数据预处理：读取日K、实时行情，计算指标，生成前端JSON
"""
import json
import os
import sys
from collections import OrderedDict
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stocklight.config import (
    DATE_RAW_DIR, STOCKS_META_FILE, STOCKS_REALTIME_FILE,
    PREPROCESS_LOG,
    KLINE_COLUMNS, KLINE_LIMIT_FRONTEND,
)
from stocklight.utils import (
    read_csv, ensure_dir, safe_float, safe_int, setup_logger,
    print_progress, confirm_y,
)

logger = setup_logger("preprocess", PREPROCESS_LOG)


def calc_ma(values, window):
    if len(values) < window:
        return None
    return round(sum(values[-window:]) / window, 2)


def calc_rsi(closes, period=6):
    if len(closes) < period + 1:
        return None
    gains = []
    losses = []
    for i in range(len(closes) - period, len(closes)):
        if i == 0:
            continue
        diff = closes[i] - closes[i - 1]
        if diff > 0:
            gains.append(diff)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(diff))
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    rsi = 100 - 100 / (1 + rs)
    return round(rsi, 2)


def process_stock(code, meta_map, realtime_map):
    csv_path = os.path.join(DATE_RAW_DIR, f"{code}.csv")
    rows = read_csv(csv_path)
    if not rows:
        logger.warning(f"{code}: CSV为空或不存在")
        return None

    closes = []
    volumes = []
    highs = []
    lows = []
    parsed_kline = []

    prev_close = None
    for row in rows:
        d = row.get("date", "").strip()
        close = safe_float(row.get("close"))
        open_p = safe_float(row.get("open"))
        high = safe_float(row.get("high"))
        low = safe_float(row.get("low"))
        volume = safe_int(row.get("volume"))

        if not d or close is None:
            continue

        closes.append(close)
        volumes.append(volume or 0)
        highs.append(high or 0)
        lows.append(low or 0)

        if prev_close is not None and prev_close != 0:
            amplitude = round((high - low) / prev_close * 100, 2) if high and low else None
        else:
            amplitude = None

        ma5 = calc_ma(closes, 5)
        ma10 = calc_ma(closes, 10)
        ma20 = calc_ma(closes, 20)
        ma60 = calc_ma(closes, 60)
        vol_ma5 = calc_ma(volumes, 5)

        parsed_kline.append({
            "date": d,
            "open": open_p or 0,
            "high": high or 0,
            "low": low or 0,
            "close": close,
            "volume": volume or 0,
            "pctchg": safe_float(row.get("pctchg"), 0),
            "ma5": ma5,
            "ma10": ma10,
            "ma20": ma20,
            "ma60": ma60,
            "vol_ma5": vol_ma5,
            "amplitude": amplitude,
        })
        prev_close = close

    if not parsed_kline:
        return None

    latest = parsed_kline[-1]
    latest_close = latest["close"]
    all_closes = [k["close"] for k in parsed_kline]
    rsi6 = calc_rsi(all_closes, 6)

    name = meta_map.get(code, "")
    rt = realtime_map.get(code, {})

    summary = {
        "code": code,
        "name": name,
        "latest_date": latest["date"],
        "open": latest["open"],
        "high": latest["high"],
        "low": latest["low"],
        "close": latest_close,
        "volume": latest["volume"],
        "pctchg": latest["pctchg"],
        "amplitude": latest["amplitude"],
        "volume_ratio": rt.get("volume_ratio"),
        "turnover_rate": rt.get("turnover_rate"),
        "realtime_amount": rt.get("amount"),
        "market_cap": rt.get("market_cap"),
        "float_market_cap": rt.get("float_market_cap"),
        "pe_ttm": rt.get("pe_ttm"),
        "pb": rt.get("pb"),
    }

    kline_limit = KLINE_LIMIT_FRONTEND
    kline_data = {
        "code": code,
        "name": name,
        "latest_date": latest["date"],
        "kline_limit": kline_limit,
        "kline": parsed_kline[-kline_limit:],
    }

    return summary, kline_data


def load_meta():
    meta = {}
    rows = read_csv(STOCKS_META_FILE)
    for row in rows:
        meta[row.get("code", "")] = row.get("name", "")
    return meta


def load_realtime():
    rt = {}
    rows = read_csv(STOCKS_REALTIME_FILE)
    for row in rows:
        code = row.get("code", "")
        if code:
            parsed = {}
            for k, v in row.items():
                if k == "name":
                    parsed[k] = v
                elif k in ("price", "volume_ratio", "turnover_rate", "amount",
                           "market_cap", "float_market_cap", "pe_ttm", "pb",
                           "limit_up", "limit_down"):
                    parsed[k] = safe_float(v)
                elif k == "updated_at":
                    parsed[k] = v
                elif k in ("code", "generated_at"):
                    continue
                else:
                    parsed[k] = v
            rt[code] = parsed
    return rt


_yes_mode = False


def main():
    global _yes_mode
    import argparse
    parser = argparse.ArgumentParser(description="数据预处理")
    parser.add_argument("--yes", action="store_true", help="跳过确认提示")
    args, _ = parser.parse_known_args()
    _yes_mode = args.yes

    print("\n【数据预处理】计算指标并生成前端 JSON")
    logger.info("开始预处理")

    ensure_dir(DATE_RAW_DIR)
    ensure_dir(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web", "data", "kline"))

    meta_map = load_meta()
    realtime_map = load_realtime()

    print(f"  元数据: {len(meta_map)} 条 | 实时行情: {len(realtime_map)} 条")
    logger.info(f"元数据: {len(meta_map)}条, 实时: {len(realtime_map)}条")

    summaries = []
    kline_count = 0
    skipped = 0

    web_data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web", "data")
    kline_dir = os.path.join(web_data_dir, "kline")
    ensure_dir(kline_dir)

    csv_files = [f for f in os.listdir(DATE_RAW_DIR) if f.endswith(".csv")]
    total = len(csv_files)
    print(f"  待处理: {total} 只股票")
    if not _yes_mode and not confirm_y("按 Y 开始预处理"):
        print("已取消"); return

    for i, fname in enumerate(csv_files, 1):
        code = fname.replace(".csv", "")
        print_progress(i, total, "  预处理: ")
        try:
            result = process_stock(code, meta_map, realtime_map)
            if result is None:
                skipped += 1
                continue
            summary, kline_data = result
            summaries.append(summary)

            kline_path = os.path.join(kline_dir, f"{code}.json")
            with open(kline_path, "w", encoding="utf-8") as f:
                json.dump(kline_data, f, ensure_ascii=False, default=str)
            kline_count += 1
        except Exception as e:
            logger.error(f"{code}: 处理异常 - {e}")
            skipped += 1

    summary_json = {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "count": len(summaries),
        "stocks": summaries,
    }

    summary_path = os.path.join(web_data_dir, "summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary_json, f, ensure_ascii=False, default=str)

    logger.info(f"完成: summary生成({summary_json['count']}只), kline生成({kline_count}只), 跳过{skipped}")
    print(f"\n完成: summary {len(summaries)} 只, kline {kline_count} 只, 跳过 {skipped}")


if __name__ == "__main__":
    main()
