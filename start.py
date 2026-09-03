"""
GridPulse AI startup script — starts both Express backend and Vite frontend from main project.
Usage: python start.py
"""
import subprocess
import sys
import os
import time
import webbrowser

def run():
    print("\n=== GridPulse AI — Challenge 14 Launcher ===")
    print("Starting Express API on http://localhost:5000")
    print("Starting React Frontend on http://localhost:5173")
    print("Press Ctrl+C to stop\n")

    root_dir = os.path.dirname(os.path.abspath(__file__))

    # Start Express Server
    backend = subprocess.Popen(
        ["node", "src/server/index.js"],
        cwd=root_dir,
        shell=True,
    )

    time.sleep(2)

    # Start Vite React Frontend
    frontend = subprocess.Popen(
        ["npx", "vite"],
        cwd=root_dir,
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
        print("\nShutting down GridPulse services...")
        backend.terminate()
        frontend.terminate()

if __name__ == "__main__":
    run()
