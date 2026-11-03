#!/usr/bin/env python3
"""Read numeric lines from an Arduino serial port and upload them to Supabase."""

import logging
import os
import sys
from pathlib import Path

import serial
from dotenv import load_dotenv
from httpx import HTTPError
from postgrest.exceptions import APIError
from supabase import Client, create_client


# Set this to the Arduino port shown by macOS, for example "/dev/cu.usbmodem1101".
SERIAL_PORT = "/dev/cu.usbmodem11201"
BAUD_RATE = 9600
TABLE_NAME = "readings"
PROJECT_DIR = Path(__file__).resolve().parent

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def create_supabase_client() -> Client:
    load_dotenv(PROJECT_DIR / ".env")
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError(
            "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in the project .env file."
        )
    return create_client(url, key)


def main() -> int:
    try:
        client = create_supabase_client()
    except RuntimeError as error:
        logger.error("%s", error)
        return 1

    try:
        with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1) as arduino:
            logger.info("Reading Arduino data from %s at %s baud.", SERIAL_PORT, BAUD_RATE)
            while True:
                raw_line = arduino.readline()
                if not raw_line:
                    continue

                line = raw_line.decode("utf-8", errors="replace").strip()
                if not line:
                    continue

                try:
                    value = float(line)
                except ValueError:
                    logger.warning("Skipping non-numeric serial line: %s", line)
                    continue

                try:
                    client.table(TABLE_NAME).insert({"value": value}).execute()
                except (APIError, HTTPError):
                    logger.exception("Failed to upload a reading to Supabase.")
                    return 1

                logger.info("Uploaded reading value: %s", value)
    except serial.SerialException:
        logger.exception("Could not use serial port %s.", SERIAL_PORT)
        return 1
    except KeyboardInterrupt:
        logger.info("Stopped by user; serial port closed.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
