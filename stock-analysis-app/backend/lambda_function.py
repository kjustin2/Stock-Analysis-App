import os
from mangum import Mangum
from app.main import app

# Configure for Lambda environment
if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    # Running in Lambda - no root path needed for Function URLs
    pass

# Create the Lambda handler with Function URL support
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """
    AWS Lambda handler function.
    Supports both API Gateway and Function URL events.
    
    Args:
        event: Lambda event (API Gateway or Function URL)
        context: Lambda context
        
    Returns:
        HTTP response
    """
    return handler(event, context) 