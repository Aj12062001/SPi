#!/bin/bash

# CompreFace Setup Script for SPi CCTV Monitoring
# This script sets up and starts CompreFace service for optimal CCTV video processing

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     CompreFace Setup for SPi CCTV Monitoring System           ║"
echo "╚════════════════════════════════════════════════════════════════╝"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
COMPREFACE_DIR="$SCRIPT_DIR/CompreFace-master"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Navigate to CompreFace directory
cd "$COMPREFACE_DIR"

echo ""
echo "📋 Step 1: Configuring environment..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# CompreFace Environment Configuration
POSTGRES_VERSION=14.5
ADMIN_VERSION=latest
API_VERSION=latest
registry=

postgres_username=postgres
postgres_password=secure_compreface_password
postgres_db=compreface
postgres_domain=compreface-postgres-db
postgres_port=5432

enable_email_server=false
email_host=smtp.gmail.com
email_username=your_email@gmail.com
email_from=noreply@compreface.com
email_password=your_app_password

compreface_admin_java_options=-Xmx1024m
compreface_api_java_options=-Xmx2048m

max_file_size=33554432
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📋 Step 2: Starting CompreFace services..."
echo "This may take 2-3 minutes on first run..."

# Start CompreFace
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for CompreFace to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking services..."
docker-compose ps

echo ""
echo "📋 Step 3: Verifying CompreFace API..."

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
        echo "✅ CompreFace API is responding"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo "❌ CompreFace API did not start within timeout"
        echo "Check logs with: docker-compose logs -f"
        exit 1
    fi
    
    echo "⏳ Attempt $ATTEMPT/$MAX_ATTEMPTS... waiting for API"
    sleep 2
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          CompreFace Setup Complete! ✅                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"

echo ""
echo "📌 Next Steps:"
echo ""
echo "1. Access CompreFace UI:"
echo "   🌐 http://localhost:3000"
echo ""
echo "2. Access CompreFace API:"
echo "   🔌 http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo ""
echo "3. Start SPi Backend (in new terminal):"
echo "   cd '$SCRIPT_DIR'"
echo "   python -m uvicorn backend.app:app --reload"
echo ""
echo "4. Upload CCTV Videos:"
echo "   Go to DataInput tab in SPi application"
echo "   Upload video for CompreFace analysis"
echo ""
echo "⚙️  Useful Commands:"
echo ""
echo "   View logs:"
echo "   docker-compose logs -f"
echo ""
echo "   Stop services:"
echo "   docker-compose down"
echo ""
echo "   Stop and remove data:"
echo "   docker-compose down -v"
echo ""
echo "   Restart services:"
echo "   docker-compose restart"
echo ""
echo "📖 Documentation:"
echo "   $COMPREFACE_DIR/docs/Installation-options.md"
echo "   $COMPREFACE_DIR/docs/How-to-Use-CompreFace.md"
echo ""
