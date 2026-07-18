import os
import tempfile

import preprocess
from preprocess import calc_ma, calc_rsi, process_stock


class TestCalcMA:
    def test_basic(self):
        values = [1, 2, 3, 4, 5]
        assert calc_ma(values, 5) == 3.0

    def test_not_enough_data(self):
        values = [1, 2, 3]
        assert calc_ma(values, 5) is None

    def test_empty(self):
        assert calc_ma([], 5) is None

    def test_larger_window(self):
        values = [10, 20, 30, 40, 50, 60]
        assert calc_ma(values, 3) == 50.0

    def test_rounding(self):
        values = [1, 1, 1, 2]
        assert calc_ma(values, 4) == 1.25


class TestCalcRSI:
    def test_not_enough_data(self):
        assert calc_rsi([1, 2], 6) is None

    def test_all_up(self):
        closes = [10, 11, 12, 13, 14, 15, 16]
        rsi = calc_rsi(closes, 6)
        assert rsi == 100.0

    def test_all_down(self):
        closes = [16, 15, 14, 13, 12, 11, 10]
        rsi = calc_rsi(closes, 6)
        assert rsi == 0.0

    def test_flat(self):
        closes = [10] * 10
        rsi = calc_rsi(closes, 6)
        assert rsi == 100.0

    def test_mixed(self):
        closes = [10, 12, 11, 13, 12, 14, 13]
        rsi = calc_rsi(closes, 6)
        assert 0 < rsi < 100


class TestProcessStock:
    SAMPLE_CSV = (
        "date,code,open,high,low,close,volume,pctchg\n"
        "20250101,000001,10.0,11.0,9.5,10.5,100000,2.0\n"
        "20250102,000001,10.5,12.0,10.0,11.5,150000,3.0\n"
        "20250103,000001,11.5,13.0,11.0,12.5,200000,4.0\n"
        "20250104,000001,12.5,14.0,12.0,13.5,250000,5.0\n"
        "20250105,000001,13.5,15.0,13.0,14.5,300000,6.0\n"
        "20250106,000001,14.5,16.0,14.0,15.5,350000,7.0\n"
    )
    SAMPLE_CSV_SHORT = (
        "date,code,open,high,low,close,volume,pctchg\n"
        "20250101,000001,10.0,11.0,9.5,10.5,100000,2.0\n"
    )

    def setup_method(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.raw_dir = os.path.join(self.tmpdir.name, "date", "raw")
        os.makedirs(self.raw_dir, exist_ok=True)

    def teardown_method(self):
        self.tmpdir.cleanup()

    def _write_csv(self, code, content):
        fp = os.path.join(self.raw_dir, f"{code}.csv")
        with open(fp, "w", encoding="utf-8") as f:
            f.write(content)

    def test_process_stock_basic(self, monkeypatch):
        self._write_csv("000001", self.SAMPLE_CSV)
        monkeypatch.setattr(preprocess, "DATE_RAW_DIR", self.raw_dir)
        monkeypatch.setattr(preprocess, "KLINE_LIMIT_FRONTEND", 260)

        meta_map = {"000001": "平安银行"}
        realtime_map = {"000001": {"volume_ratio": 1.5, "pe_ttm": 8.5}}

        result = process_stock("000001", meta_map, realtime_map)
        assert result is not None
        summary, kline_data = result

        assert summary["code"] == "000001"
        assert summary["name"] == "平安银行"
        assert summary["close"] == 15.5
        assert summary["pe_ttm"] == 8.5

        assert kline_data["code"] == "000001"
        assert len(kline_data["kline"]) == 6

        last_k = kline_data["kline"][-1]
        assert last_k["ma5"] == 13.5

    def test_process_stock_no_csv(self, monkeypatch):
        empty_dir = os.path.join(self.tmpdir.name, "empty")
        os.makedirs(empty_dir, exist_ok=True)
        monkeypatch.setattr(preprocess, "DATE_RAW_DIR", empty_dir)
        monkeypatch.setattr(preprocess, "KLINE_LIMIT_FRONTEND", 260)

        result = process_stock("000001", {}, {})
        assert result is None

    def test_process_stock_insufficient_data(self, monkeypatch):
        self._write_csv("000001", self.SAMPLE_CSV_SHORT)
        monkeypatch.setattr(preprocess, "DATE_RAW_DIR", self.raw_dir)
        monkeypatch.setattr(preprocess, "KLINE_LIMIT_FRONTEND", 260)

        result = process_stock("000001", {"000001": "Test"}, {})
        assert result is not None
        summary, kline_data = result
        assert len(kline_data["kline"]) == 1
        assert kline_data["kline"][0]["ma5"] is None
