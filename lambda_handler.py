"""AWS Lambda entrypoint (Mangum + FastAPI)."""

from app.main import create_app
from mangum import Mangum

app = create_app()
handler = Mangum(app, lifespan="auto")
