import os
import tempfile

import pytest
from stocklight.utils import (
    build_sina_code,
    build_tencent_code,
    confirm_y,
    ensure_dir,
    get_market_prefix,
    print_progress,
    read_csv,
    safe_float,
    safe_int,
    setup_logger,
    write_csv,
)


class TestMarketPrefix:
    def test_shenzhen_0(self):
        assert get_market_prefix("000001") == "sz"

    def test_shenzhen_3(self):
        assert get_market_prefix("300001") == "sz"

    def test_shanghai(self):
        assert get_market_prefix("600001") == "sh"

    def test_beijing(self):
        assert get_market_prefix("830001") == "bj"

    def test_fallback(self):
        assert get_market_prefix("900001") == "sh"


class TestBuildCode:
    def test_tencent(self):
        assert build_tencent_code("000001") == "sz000001"
        assert build_tencent_code("600001") == "sh600001"

    def test_sina(self):
        assert build_sina_code("000001") == "sz000001"
        assert build_sina_code("600001") == "sh600001"


class TestSafeFloat:
    def test_valid(self):
        assert safe_float("3.14") == 3.14

    def test_none(self):
        assert safe_float(None) is None

    def test_empty(self):
        assert safe_float("") is None

    def test_invalid(self):
        assert safe_float("abc") is None

    def test_default(self):
        assert safe_float("abc", 0.0) == 0.0

    def test_int_string(self):
        assert safe_float("42") == 42.0


class TestSafeInt:
    def test_valid(self):
        assert safe_int("42") == 42

    def test_float_string(self):
        assert safe_int("3.14") == 3

    def test_none(self):
        assert safe_int(None) is None

    def test_empty(self):
        assert safe_int("") is None

    def test_invalid(self):
        assert safe_int("abc") is None

    def test_default(self):
        assert safe_int("abc", 0) == 0


class TestCsvIO:
    def test_read_write_roundtrip(self):
        fieldnames = ["code", "name", "price"]
        rows = [
            {"code": "000001", "name": "平安银行", "price": "12.34"},
            {"code": "600001", "name": "测试股票", "price": "5.67"},
        ]
        with tempfile.TemporaryDirectory() as tmpdir:
            fp = os.path.join(tmpdir, "test.csv")
            write_csv(fp, rows, fieldnames)
            loaded = read_csv(fp)
            assert len(loaded) == 2
            assert loaded[0]["code"] == "000001"
            assert loaded[0]["name"] == "平安银行"
            assert loaded[1]["price"] == "5.67"

    def test_read_nonexistent(self):
        assert read_csv("/nonexistent/path.csv") == []

    def test_write_creates_dir(self):
        fieldnames = ["code"]
        rows = [{"code": "000001"}]
        with tempfile.TemporaryDirectory() as tmpdir:
            nested = os.path.join(tmpdir, "sub", "nested", "test.csv")
            write_csv(nested, rows, fieldnames)
            assert os.path.isfile(nested)
            loaded = read_csv(nested)
            assert len(loaded) == 1


class TestEnsureDir:
    def test_creates(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            new_dir = os.path.join(tmpdir, "a", "b", "c")
            ensure_dir(new_dir)
            assert os.path.isdir(new_dir)

    def test_existing(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            ensure_dir(tmpdir)
            assert os.path.isdir(tmpdir)


class TestPrintProgress:
    def test_no_error(self, capsys):
        print_progress(5, 10, prefix="test")
        captured = capsys.readouterr()
        assert "test" in captured.out

    def test_zero_total(self, capsys):
        print_progress(0, 0, prefix="x")
        captured = capsys.readouterr()
        assert captured.out == ""


class TestConfirmY:
    def test_yes(self, monkeypatch):
        monkeypatch.setattr("builtins.input", lambda: "y")
        assert confirm_y("?") is True

    def test_no(self, monkeypatch):
        monkeypatch.setattr("builtins.input", lambda: "n")
        assert confirm_y("?") is False

    def test_chinese_yes(self, monkeypatch):
        monkeypatch.setattr("builtins.input", lambda: "是")
        assert confirm_y("?") is True

    def test_eof(self, monkeypatch):
        def raise_eof():
            raise EOFError()
        monkeypatch.setattr("builtins.input", lambda _=None: raise_eof())
        assert confirm_y("?") is False

    def test_keyboard_interrupt(self, monkeypatch):
        def raise_ki():
            raise KeyboardInterrupt()
        monkeypatch.setattr("builtins.input", lambda _=None: raise_ki())
        assert confirm_y("?") is False


class TestSetupLogger:
    def test_creates_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = os.path.join(tmpdir, "test.log")
            logger = setup_logger("test_logger", log_file)
            logger.info("hello")
            for h in logger.handlers:
                h.close()
            logger.handlers.clear()
            assert os.path.isfile(log_file)
            with open(log_file, "r") as f:
                content = f.read()
            assert "hello" in content

    def test_reuses_handlers(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = os.path.join(tmpdir, "test2.log")
            logger = setup_logger("test_logger2", log_file)
            before = len(logger.handlers)
            logger2 = setup_logger("test_logger2", log_file)
            assert len(logger2.handlers) == before
            for h in logger.handlers:
                h.close()
            logger.handlers.clear()
