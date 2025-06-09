import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import stocks

# Create FastAPI app
app = FastAPI(
    title="Stock Analysis API",
    description="Simple API for stock analysis",
    version="1.0.0"
)

# Configure CORS origins based on environment
cors_origins = [
    "http://localhost:5173", 
    "http://localhost:3000",
    "https://kjustin2.github.io"  # Your GitHub Pages domain
]

# Add any additional origins from environment variable
if os.getenv("CORS_ORIGINS"):
    additional_origins = os.getenv("CORS_ORIGINS").split(",")
    cors_origins.extend([origin.strip() for origin in additional_origins])

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(stocks.router, prefix="/stocks", tags=["stocks"])

@app.get("/")
def read_root():
    """Root endpoint."""
    return {"status": "healthy"}

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004) 