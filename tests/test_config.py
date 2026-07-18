import os

from stocklight.config import (
    CODES_FILE,
    DATA_DIR,
    DATE_RAW_DIR,
    HTTP_HEADERS,
    KLINE_COLUMNS,
    KLINE_LIMIT,
    KLINE_LIMIT_FRONTEND,
    LOGS_DIR,
    META_COLUMNS,
    PROJECT_ROOT,
    REALTIME_COLUMNS,
    REQUEST_RETRIES,
    REQUEST_TIMEOUT,
    SINA_RATE_LIMIT,
    STOCKS_META_FILE,
    STOCKS_REALTIME_FILE,
    TENCENT_RATE_LIMIT,
    rate_limit,
)


class TestPaths:
    def test_project_root_is_absolute(self):
        assert os.path.isabs(PROJECT_ROOT)

    def test_project_root_ends_with_stocklight(self):
        assert os.path.basename(PROJECT_ROOT) == "Stocklight"

    def test_codes_file(self):
        assert CODES_FILE == os.path.join(PROJECT_ROOT, "codes.txt")

    def test_data_dir(self):
        assert DATA_DIR == os.path.join(PROJECT_ROOT, "data")

    def test_date_raw_dir(self):
        assert DATE_RAW_DIR == os.path.join(DATA_DIR, "date", "raw")

    def test_logs_dir(self):
        assert LOGS_DIR == os.path.join(DATA_DIR, "logs")

    def test_stocks_meta_file(self):
        assert STOCKS_META_FILE == os.path.join(DATA_DIR, "stocks_meta.csv")

    def test_stocks_realtime_file(self):
        assert STOCKS_REALTIME_FILE == os.path.join(DATA_DIR, "stocks_realtime.csv")


class TestConstants:
    def test_kline_columns(self):
        assert KLINE_COLUMNS == ["date", "code", "open", "high", "low", "close", "volume", "pctchg"]

    def test_meta_columns(self):
        assert META_COLUMNS == ["code", "name"]

    def test_realtime_columns_has_expected_keys(self):
        assert "code" in REALTIME_COLUMNS
        assert "price" in REALTIME_COLUMNS
        assert "pe_ttm" in REALTIME_COLUMNS

    def test_kline_limits(self):
        assert KLINE_LIMIT == 320
        assert KLINE_LIMIT_FRONTEND == 260

    def test_request_params(self):
        assert REQUEST_RETRIES == 3
        assert REQUEST_TIMEOUT == 15
        assert TENCENT_RATE_LIMIT == 1.0
        assert SINA_RATE_LIMIT == 1.5

    def test_http_headers(self):
        assert "User-Agent" in HTTP_HEADERS
        assert "Mozilla" in HTTP_HEADERS["User-Agent"]


class TestRateLimit:
    def test_no_interval(self):
        rate_limit(0)
