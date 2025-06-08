from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import stocks

# Create FastAPI app
app = FastAPI(
    title="Stock Analysis API",
    description="Simple API for stock analysis",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Support both ports
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