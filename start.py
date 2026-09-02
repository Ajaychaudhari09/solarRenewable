"""
GridPulse AI startup script — starts both backend and frontend with a single command.
Usage: python start.py
"""
import subprocess
import sys
import os
import time
import webbrowser

def run():
    print("\n=== GridPulse AI ===")
    print("Starting backend on http://localhost:8000")
    print("Starting frontend on http://localhost:5173")
    print("Press Ctrl+C to stop\n")

    backend = subprocess.Popen(
        [sys.executable, "main.py"],
        cwd=os.path.join(os.path.dirname(__file__), "backend"),
    )

    time.sleep(2)  # let backend boot

    frontend = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(os.path.dirname(__file__), "frontend"),
        shell=True,
    )

    time.sleep(3)
    try:
        webbrowser.open("http://localhost:5173")
    except Exception:
        pass

    try:
        backend.wait()
        frontend.wait()
    except KeyboardInterrupt:
        print("\nShutting down...")
        backend.terminate()
        frontend.terminate()

if __name__ == "__main__":
    run()
