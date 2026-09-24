FROM python:3.14-slim

COPY --from=ghcr.io/astral-sh/uv:0.12.13 /uv /uvx /bin/

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/usr/local

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src/ ./src/
COPY static/ ./static/

# The loader, the schema it binds rows into, and the seed it builds a database from when there
# is none. The database itself is NOT baked in: a copy in the image would only ever be a stale
# one. The panels the dashboard serves come with `src/sql/`, so nothing here reads
# `data_analysis/` - that tree is named for the process that produced it, and the runtime must
# not stop answering when the analysis is renumbered.
COPY db_data/fhir_sample.sql \
     db_data/fhir_sample_load.py \
     db_data/init.sql \
     ./db_data/

EXPOSE 8000
CMD ["uv", "run", "--no-dev", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
