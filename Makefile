# TradePilot Development Commands

.PHONY: dev dev-web dev-full install clean build help docs test test-e2e lighthouse quality emulators emulators-export emulators-import

# Default target
help:
	@echo "TradePilot Development Commands"
	@echo "================================"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start web dev server only"
	@echo "  make dev-full    - Start web + Firebase emulators"
	@echo "  make emulators   - Start Firebase emulators only"
	@echo ""
	@echo "Setup:"
	@echo "  make install     - Install all dependencies"
	@echo "  make firebase-init - Initialize Firebase project"
	@echo ""
	@echo "Build:"
	@echo "  make build       - Build for production"
	@echo "  make clean       - Clean build artifacts"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run Python tests"
	@echo "  make test-e2e    - Run Playwright E2E tests"
	@echo "  make lighthouse  - Run Lighthouse audits"
	@echo "  make quality     - Run all quality checks"
	@echo ""
	@echo "Documentation:"
	@echo "  make docs        - Build documentation"
	@echo "  make docs-serve  - Serve documentation locally"
	@echo ""
	@echo "Firebase:"
	@echo "  make emulators          - Start Firebase emulators"
	@echo "  make emulators-export   - Export emulator data"
	@echo "  make emulators-import   - Import emulator data"
	@echo "  make deploy-rules       - Deploy Firestore/Storage rules"

# Start development server (web only)
dev: dev-web

dev-web:
	@echo "Starting Astro development server..."
	@echo "Open http://localhost:4321 in your browser"
	@echo "Note: Using emulators? Run 'make dev-full' instead"
	cd web && npm run dev

# Start both web and Firebase emulators
dev-full:
	@echo "Starting TradePilot with Firebase emulators..."
	@echo ""
	@echo "Services:"
	@echo "  Web:        http://localhost:4321"
	@echo "  Emulator UI: http://localhost:4000"
	@echo "  Auth:       http://localhost:9099"
	@echo "  Firestore:  http://localhost:8080"
	@echo "  Storage:    http://localhost:9199"
	@echo ""
	@trap 'kill 0' EXIT; \
		firebase emulators:start --import=.firebase-data --export-on-exit & \
		sleep 5 && cd web && npm run dev

# Install dependencies
install: install-web install-python install-playwright

install-web:
	@echo "Installing web dependencies..."
	cd web && npm install

install-python:
	@echo "Installing Python dependencies..."
	pip install -e .
	pip install sphinx sphinx-rtd-theme myst-parser

install-playwright:
	@echo "Installing Playwright browsers..."
	cd web && npx playwright install

# Build for production
build: build-web build-docs

build-web:
	@echo "Building web app..."
	cd web && npm run build

build-docs:
	@echo "Building documentation..."
	cd docs && make html

# Clean artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf web/dist
	rm -rf web/node_modules/.vite
	rm -rf docs/_build
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

# Run tests
test:
	@echo "Running Python tests..."
	pytest tests/

test-web:
	@echo "Running web tests..."
	cd web && npm run test

test-e2e:
	@echo "Running Playwright E2E tests..."
	cd web && npx playwright test

# Lighthouse audits
lighthouse:
	@echo "Running Lighthouse audits..."
	cd web && npm run lighthouse

# Quality checks (all tests + lighthouse)
quality: test test-e2e lighthouse
	@echo "All quality checks completed!"

# Documentation
docs:
	@echo "Building documentation..."
	cd docs && sphinx-build -b html . _build/html

docs-serve:
	@echo "Serving documentation at http://localhost:8000..."
	cd docs/_build/html && python -m http.server 8000

# =============================================================================
# Firebase Commands
# =============================================================================

# Start Firebase emulators only
emulators:
	@echo "Starting Firebase emulators..."
	@echo "Emulator UI: http://localhost:4000"
	firebase emulators:start --import=.firebase-data --export-on-exit

# Export emulator data
emulators-export:
	@echo "Exporting emulator data..."
	firebase emulators:export .firebase-data

# Import emulator data (start with existing data)
emulators-import:
	@echo "Starting emulators with imported data..."
	firebase emulators:start --import=.firebase-data

# Deploy Firestore and Storage rules to production
deploy-rules:
	@echo "Deploying security rules..."
	firebase deploy --only firestore:rules,storage:rules

# Deploy Firestore indexes
deploy-indexes:
	@echo "Deploying Firestore indexes..."
	firebase deploy --only firestore:indexes

# Initialize Firebase project (first-time setup)
firebase-init:
	@echo "Initializing Firebase project..."
	@echo "Make sure you have created a Firebase project at https://console.firebase.google.com"
	firebase login
	firebase use --add

# Switch to development Firebase project
firebase-dev:
	firebase use default

# Switch to production Firebase project
firebase-prod:
	firebase use production
