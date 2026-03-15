"""
WeddingBudget.ai — Entry Point

Product 3 of the WedTech Innovation Challenge by Events by Athea.
Run with: python wedtechsol.py
"""

import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG", "").lower() == "true", port=5000)
