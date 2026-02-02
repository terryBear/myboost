.PHONY: install check test build docs

install:
	@echo "Installing project dependencies..."
	poetry install
	cd frontend && npm install
	cd ../

check:
	@echo "Linting and checking code..."
	# Replace ruff, mypy, etc., with your actual linting commands
	# For example: poetry run ruff .
	# For example: poetry run mypy .

test:
	@echo "Running tests with pytest..."
	poetry run pytest

build:
	@echo "Building project package..."
	# poetry build

docs:
	@echo "Building documentation..."
	# Replace with your actual documentation build command, e.g.,
	# poetry run sphinx-build docs docs/_build

deploy:
	@echo "Deploying project..."
	# cd frontend && npm run build
	# cd ../
	poetry run python manage.py collectstatic --noinput
	poetry run gcloud app deploy