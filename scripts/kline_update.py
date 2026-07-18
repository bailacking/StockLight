#!/usr/bin/env python3
"""
日K数据采集脚本
--full      全量采集所有股票日K线
--incremental  增量更新（默认）
"""
import argparse
import json
import os
import sys
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stocklight.config import (
    CODES_FILE, DATE_RAW_DIR, UPDATE_LOG, KLINE_COLUMNS,
    TENCENT_KLINE_URL, SINA_KLINE_URL,
    KLINE_LIMIT, REQUEST_RETRIES, TENCENT_RATE_LIMIT, SINA_RATE_LIMIT,
)
from stocklight.utils import (
    http_get, http_get_json, ensure_dir, read_csv, write_csv,
    safe_float, safe_int, setup_logger, build_tencent_code, build_sina_code,
    confirm_y,
)


logger = setup_logger("kline_update", UPDATE_LOG)


def load_codes():
    codes = []
    with open(CODES_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and line.isdigit():
                codes.append(line)
    return codes


def fetch_tencent_kline(code, count=KLINE_LIMIT):
    tcode = build_tencent_code(code)
    params = f"{tcode},day,,,{count},qfq"
    url = f"{TENCENT_KLINE_URL}?param={params}"
    try:
        data = http_get_json(url, rate=TENCENT_RATE_LIMIT)
        if not data:
            return None
        stock_data = data.get("data", {}).get(tcode, {})
        klines = stock_data.get("qfqday") or stock_data.get("day")
        if klines and len(klines) > 0:
            return klines
        params_raw = f"{tcode},day,,,{count},"
        url_raw = f"{TENCENT_KLINE_URL}?param={params_raw}"
        data_raw = http_get_json(url_raw, rate=TENCENT_RATE_LIMIT)
        if data_raw:
            stock_data_raw = data_raw.get("data", {}).get(tcode, {})
            klines_raw = stock_data_raw.get("day")
            if klines_raw and len(klines_raw) > 0:
                return klines_raw
    except Exception as e:
        logger.warning(f"Tencent API error for {code}: {e}")
    return None


def fetch_sina_kline(code, count=KLINE_LIMIT):
    symbol = build_sina_code(code)
    url = f"{SINA_KLINE_URL}?symbol={symbol}&scale=240&ma=5&datalen={count}"
    try:
        resp = http_get(url, rate=SINA_RATE_LIMIT)
        if not resp:
            return None
        raw = resp.strip()
        if raw.startswith("["):
            records = json.loads(raw)
        else:
            return None
        rows = []
        for r in records:
            if not isinstance(r, dict):
                continue
            rows.append([
                r.get("day", ""),
                safe_float(r.get("open"), 0),
                safe_float(r.get("high"), 0),
                safe_float(r.get("low"), 0),
                safe_float(r.get("close"), 0),
                safe_int(r.get("volume"), 0),
            ])
        if rows:
            return rows
    except Exception as e:
        logger.warning(f"Sina API error for {code}: {e}")
    return None


def calc_pctchg(klines):
    result = []
    prev_close = None
    for k in klines:
        close = safe_float(k[4])
        if prev_close is not None and prev_close != 0:
            pct = round((close - prev_close) / prev_close * 100, 2)
        else:
            pct = 0.0
        result.append((k[0], close, pct))
        prev_close = close
    return result


def parse_tencent_kline(raw_rows, code):
    parsed = []
    for row in raw_rows:
        if not isinstance(row, (list, tuple)) or len(row) < 6:
            continue
        d = row[0]
        if not d or not isinstance(d, str):
            continue
        parsed.append({
            "date": d,
            "code": code,
            "open": safe_float(row[1], 0),
            "close": safe_float(row[2], 0),
            "high": safe_float(row[3], 0),
            "low": safe_float(row[4], 0),
            "volume": safe_int(row[5], 0),
            "pctchg": 0.0,
        })
    return parsed


def parse_sina_kline(raw_rows, code):
    parsed = []
    for row in raw_rows:
        if len(row) < 6:
            continue
        d = row[0]
        if not d or not isinstance(d, str):
            continue
        parsed.append({
            "date": d,
            "code": code,
            "open": safe_float(row[1], 0),
            "high": safe_float(row[2], 0),
            "low": safe_float(row[3], 0),
            "close": safe_float(row[4], 0),
            "volume": safe_int(row[5], 0),
            "pctchg": 0.0,
        })
    return parsed


def merge_and_sort(existing, new_rows):
    seen = {}
    for row in existing + new_rows:
        seen[row["date"]] = row
    merged = sorted(seen.values(), key=lambda x: x["date"])
    return merged


def apply_pctchg(rows):
    prev_close = None
    for row in rows:
        close = safe_float(row["close"])
        if prev_close is not None and prev_close != 0:
            row["pctchg"] = round((close - prev_close) / prev_close * 100, 2)
        else:
            row["pctchg"] = 0.0
        prev_close = close
    return rows


def process_stock(code, incremental):
    csv_path = os.path.join(DATE_RAW_DIR, f"{code}.csv")
    existing = []
    last_date = None

    if incremental:
        existing = read_csv(csv_path)
        if not existing:
            logger.info(f"{code}: CSV不存在，跳过（增量模式）")
            return "skipped"
        last_date = existing[-1]["date"]
        today_str = date.today().strftime("%Y-%m-%d")
        if last_date >= today_str:
            logger.info(f"{code}: 已是最新 ({last_date})")
            return "up_to_date"

    count = KLINE_LIMIT if not incremental else None
    raw = fetch_tencent_kline(code, KLINE_LIMIT)

    if not raw or len(raw) == 0:
        if not incremental:
            logger.warning(f"{code}: 腾讯接口无数据，尝试新浪")
            raw = fetch_sina_kline(code, KLINE_LIMIT)
        if not raw or len(raw) == 0:
            if incremental:
                logger.info(f"{code}: 接口无新数据")
                return "no_new_data"
            logger.warning(f"{code}: 所有接口均无数据")
            return "failed"

    parsed = parse_tencent_kline(raw, code)

    if incremental and last_date:
        parsed = [r for r in parsed if r["date"] > last_date]
        if not parsed:
            logger.info(f"{code}: 无新数据")
            return "no_new_data"

    merged = merge_and_sort(existing, parsed)
    merged = apply_pctchg(merged)

    write_csv(csv_path, merged, KLINE_COLUMNS)
    count_new = len(parsed) if not incremental else len(parsed)
    logger.info(f"{code}: {'全量' if not incremental else '增量'}完成 ({len(merged)}条)")
    return "updated"


def main():
    parser = argparse.ArgumentParser(description="日K数据采集")
    parser.add_argument("--full", action="store_true", help="全量采集")
    parser.add_argument("--incremental", action="store_true", default=True, help="增量更新")
    parser.add_argument("--yes", action="store_true", help="跳过确认提示")
    args = parser.parse_args()

    if args.full:
        args.incremental = False

    ensure_dir(DATE_RAW_DIR)
    codes = load_codes()
    mode = "全量采集" if args.full else "增量更新"
    print(f"\n【日K数据 - {mode}】")
    print(f"  股票数量: {len(codes)}")
    print(f"  数据目录: {DATE_RAW_DIR}")
    if not args.yes and not confirm_y("按 Y 开始采集"):
        print("已取消")
        return

    logger.info(f"开始{mode}，共{len(codes)}只股票")

    stats = {"updated": 0, "up_to_date": 0, "no_new_data": 0, "skipped": 0, "failed": 0}
    total = len(codes)

    for i, code in enumerate(codes, 1):
        try:
            result = process_stock(code, args.incremental)
            stats[result] = stats.get(result, 0) + 1
        except Exception as e:
            logger.error(f"{code}: 异常 - {e}")
            stats["failed"] += 1
        percent = i / total
        filled = int(30 * percent)
        bar = "#" * filled + "." * (30 - filled)
        s = stats
        print(f"\r  {mode}: [{bar}] {i}/{total} ({percent:.1%}) | "
              f"更新{s['updated']} 最新{s['up_to_date']} "
              f"无数据{s['no_new_data']} 跳过{s['skipped']} 失败{s['failed']}", end="")

    summary = (f"采集完成: 更新{stats['updated']}, "
               f"已最新{stats['up_to_date']}, "
               f"无新数据{stats['no_new_data']}, "
               f"跳过{stats['skipped']}, "
               f"失败{stats['failed']}")
    logger.info(summary)
    print(f"\n结果: {summary}")


if __name__ == "__main__":
    main()
