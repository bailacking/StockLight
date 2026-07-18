#!/usr/bin/env python3
"""
数据采集集：--names / --realtime
"""
import argparse
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stocklight.config import (
    CODES_FILE, STOCKS_META_FILE, STOCKS_REALTIME_FILE,
    LOGS_DIR,
    META_COLUMNS, REALTIME_COLUMNS,
    TENCENT_REALTIME_URL, TENCENT_RATE_LIMIT,
)
from stocklight.utils import (
    http_get, ensure_dir, write_csv, read_csv,
    safe_float, safe_int, setup_logger,
    get_market_prefix, confirm_y,
)


def load_codes():
    codes = []
    with open(CODES_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and line.isdigit():
                codes.append(line)
    return codes


def batch_tencent_realtime(codes, rate=TENCENT_RATE_LIMIT):
    url = TENCENT_REALTIME_URL + "=" + ",".join(
        f"{get_market_prefix(c)}{c}" for c in codes
    )
    text = http_get(url, rate=rate, encoding="gbk")
    if not text:
        return []
    results = {}
    for line in text.strip().split("\n"):
        line = line.strip()
        if not line or not line.startswith("v_"):
            continue
        try:
            eq_pos = line.index("=")
            raw = line[eq_pos + 1:].strip().strip('"').strip(";").strip('"')
            parts = raw.split("~")
            if len(parts) < 2:
                continue
            results[parts[2]] = parts
        except (ValueError, IndexError):
            continue
    return results


_yes_mode = False

def do_names():
    logger = setup_logger("fetch_names", os.path.join(LOGS_DIR, "fetch_names.log"))
    codes = load_codes()
    total = len(codes)
    print(f"\n【采集股票名称】共 {total} 只")
    if not _yes_mode and not confirm_y("按 Y 开始采集"):
        print("已取消"); return
    logger.info(f"开始采集股票名称，共{total}只")

    batch_size = 100
    all_rows = []
    success = 0
    failed = 0

    for i in range(0, total, batch_size):
        batch = codes[i:i + batch_size]
        results = batch_tencent_realtime(batch)
        for code in batch:
            parts = results.get(code)
            if parts and len(parts) > 1:
                all_rows.append({"code": code, "name": parts[1]})
                success += 1
            else:
                failed += 1
        done = min(i + batch_size, total)
        print(f"\r  名称: {done}/{total} ({done/total:.1%}) | 成功{success} 失败{failed}", end="")

    write_csv(STOCKS_META_FILE, all_rows, META_COLUMNS)
    logger.info(f"完成: 成功{success}, 失败{failed}, 共{len(all_rows)}条")
    print(f"\n完成: 成功 {success}, 失败 {failed}")


def do_realtime():
    logger = setup_logger("fetch_realtime", os.path.join(LOGS_DIR, "fetch_realtime.log"))
    codes = load_codes()
    total = len(codes)
    print(f"\n【采集实时行情】共 {total} 只")
    if not _yes_mode and not confirm_y("按 Y 开始采集"):
        print("已取消"); return
    logger.info(f"开始采集实时行情，共{total}只")

    batch_size = 100
    all_rows = []
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    success = 0
    failed = 0

    for i in range(0, total, batch_size):
        batch = codes[i:i + batch_size]
        results = batch_tencent_realtime(batch)
        for code in batch:
            p = results.get(code)
            if not p or len(p) < 48:
                failed += 1
                continue
            try:
                row = {
                    "code": code,
                    "name": p[1] if len(p) > 1 else "",
                    "price": safe_float(p[3], 0),
                    "volume_ratio": safe_float(p[49]) if len(p) > 49 else None,
                    "turnover_rate": safe_float(p[38]) if len(p) > 38 else None,
                    "amount": safe_float(p[37], 0) * 10000 if safe_float(p[37]) else 0,
                    "market_cap": safe_float(p[45]) if len(p) > 45 else None,
                    "float_market_cap": safe_float(p[44]) if len(p) > 44 else None,
                    "pe_ttm": safe_float(p[39]) if len(p) > 39 else None,
                    "pb": safe_float(p[46]) if len(p) > 46 else None,
                    "limit_up": safe_float(p[47]) if len(p) > 47 else None,
                    "limit_down": safe_float(p[48]) if len(p) > 48 else None,
                    "updated_at": p[30] if len(p) > 30 else "",
                    "generated_at": now_str,
                }
                all_rows.append(row)
                success += 1
            except (IndexError, ValueError):
                failed += 1
        done = min(i + batch_size, total)
        print(f"\r  实时: {done}/{total} ({done/total:.1%}) | 成功{success} 失败{failed}", end="")

    write_csv(STOCKS_REALTIME_FILE, all_rows, REALTIME_COLUMNS)
    logger.info(f"完成: 成功{success}, 失败{failed}, 共{len(all_rows)}条")
    print(f"\n完成: 成功 {success}, 失败 {failed}")


def main():
    global _yes_mode
    parser = argparse.ArgumentParser(description="数据采集集")
    parser.add_argument("--names", action="store_true", help="采集股票名称")
    parser.add_argument("--realtime", action="store_true", help="采集实时行情")
    parser.add_argument("--yes", action="store_true", help="跳过确认提示")
    args = parser.parse_args()
    _yes_mode = args.yes

    if not (args.names or args.realtime):
        parser.print_help()
        return

    if args.names:
        do_names()
    if args.realtime:
        do_realtime()


if __name__ == "__main__":
    main()
