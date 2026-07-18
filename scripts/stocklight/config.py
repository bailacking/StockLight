import os
import time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

CODES_FILE = os.path.join(PROJECT_ROOT, "codes.txt")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
DATE_RAW_DIR = os.path.join(DATA_DIR, "date", "raw")
LOGS_DIR = os.path.join(DATA_DIR, "logs")
STOCKS_META_FILE = os.path.join(DATA_DIR, "stocks_meta.csv")
STOCKS_REALTIME_FILE = os.path.join(DATA_DIR, "stocks_realtime.csv")

UPDATE_LOG = os.path.join(LOGS_DIR, "update.log")
PREPROCESS_LOG = os.path.join(LOGS_DIR, "preprocess.log")

KLINE_COLUMNS = ["date", "code", "open", "high", "low", "close", "volume", "pctchg"]
META_COLUMNS = ["code", "name"]
REALTIME_COLUMNS = [
    "code", "name", "price", "volume_ratio", "turnover_rate", "amount",
    "market_cap", "float_market_cap", "pe_ttm", "pb",
    "limit_up", "limit_down", "updated_at", "generated_at",
]
TENCENT_KLINE_URL = "https://ifzq.gtimg.cn/appstock/app/fqkline/get"
TENCENT_REALTIME_URL = "http://qt.gtimg.cn/q"
SINA_KLINE_URL = "http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData"

KLINE_LIMIT = 320
KLINE_LIMIT_FRONTEND = 260

REQUEST_RETRIES = 3
REQUEST_TIMEOUT = 15
TENCENT_RATE_LIMIT = 1.0
SINA_RATE_LIMIT = 1.5

HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "*/*",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

_last_request_time = 0.0

def rate_limit(interval):
    global _last_request_time
    elapsed = time.time() - _last_request_time
    if elapsed < interval:
        time.sleep(interval - elapsed)
    _last_request_time = time.time()
