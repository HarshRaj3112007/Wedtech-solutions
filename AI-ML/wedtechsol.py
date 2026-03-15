"""
WeddingBudget.ai — Entry Point

Product 3 of the WedTech Innovation Challenge by Events by Athea.
Run with: python wedtechsol.py
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
