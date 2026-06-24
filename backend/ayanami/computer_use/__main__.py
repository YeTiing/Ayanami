"""
Computer Use server entry point.
Usage: python -m computer_use
"""
from .server import serve
import asyncio

if __name__ == "__main__":
    asyncio.run(serve())