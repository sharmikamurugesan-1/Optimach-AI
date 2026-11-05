"""
Optimach-AI Root Application Entrypoint
Delegates execution to the backend Flask ML API.
"""

import os
import sys

# Add backend directory to system path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_dir)

try:
    from app import app
except ImportError:
    import backend.app as b_app
    app = b_app.app

if __name__ == "__main__":
    print("=" * 60)
    print("Optimach-AI Industrial Predictive Maintenance System")
    print("Starting Flask Backend API on http://127.0.0.1:5000 ...")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=False)
