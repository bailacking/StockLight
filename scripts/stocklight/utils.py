import csv
import os
import requests
import logging
import io

from .config import (
    HTTP_HEADERS, REQUEST_RETRIES, REQUEST_TIMEOUT,
    TENCENT_RATE_LIMIT, SINA_RATE_LIMIT, rate_limit,
)


def get_market_prefix(code):
    first = code[0]
    if first in ("0", "3"):
        return "sz"
    elif first == "6":
        return "sh"
    elif first == "8":
        return "bj"
    return "sh"


def build_tencent_code(code):
    return f"{get_market_prefix(code)}{code}"


def build_sina_code(code):
    market = get_market_prefix(code)
    return f"{market}{code}"


def http_get(url, retries=REQUEST_RETRIES, rate=1.0, encoding=None):
    rate_limit(rate)
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, headers=HTTP_HEADERS, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            if encoding:
                resp.encoding = encoding
            return resp.text
        except requests.RequestException as e:
            if attempt < retries:
                continue
            raise e
    return None


def http_get_json(url, retries=REQUEST_RETRIES, rate=1.0):
    rate_limit(rate)
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, headers=HTTP_HEADERS, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            if attempt < retries:
                continue
            raise e
    return None


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def read_csv(filepath):
    rows = []
    if not os.path.isfile(filepath):
        return rows
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def write_csv(filepath, rows, fieldnames):
    ensure_dir(os.path.dirname(filepath))
    tmp = filepath + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    os.replace(tmp, filepath)


def safe_float(val, default=None):
    if val is None or val == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_int(val, default=None):
    if val is None or val == "":
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def print_progress(current, total, prefix="", bar_length=30):
    if total == 0:
        return
    percent = current / total
    filled = int(bar_length * percent)
    bar = "#" * filled + "." * (bar_length - filled)
    print(f"\r{prefix}[{bar}] {current}/{total} ({percent:.1%})", end="")
    if current >= total:
        print()


def confirm_y(msg="是否继续？"):
    print(f"\n{msg} (Y/N): ", end="")
    try:
        inp = input().strip().lower()
        return inp in ("y", "yes", "是")
    except (EOFError, KeyboardInterrupt):
        return False


def setup_logger(name, log_file, level=logging.INFO):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    if logger.handlers:
        return logger
    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(fh)
    return logger
