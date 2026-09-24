# FHIR Patient Summary

A dashboard over a sample of FHIR data: the patients **database** holds a list of sample data, which is presented on the UI for a user to view.
Each patient's data represent a summary view of that synthesises information from multiple FHIR resource types, which aims for easy to understand.

## How to Run

### Full Docker

- `git clone git@github.com:mingzilla/fhir_patient_summary.git`
- `docker compose up -d`
- access `http://localhost:8000`

### Dev Mode

- `./start.sh`
- access `http://localhost:8021`
- `./stop.sh` to stop it

## What it shows

![dashboard_screen.png](docs/screenshots/dashboard_screen.png)

## How it Works

```mermaid
sequenceDiagram
    actor C as Clinician
    participant U as UI
    participant B as Dashboard API
    participant D as database
    Note over C, D: land
    C ->> U: open localhost:8000
    U ->> B: the patients in database
    B ->> D: read
    D -->> B: patient data
    B -->> U: names
    U -->> C: the list
    Note over C, D: open
    C ->> U: pick one
    U ->> B: the seven panels for that id
    B ->> D: the seven verified queries
    D -->> B: rows
    B -->> U: panels
    U -->> C: database, drawn
```

## Data Ingesting and Display

```mermaid
sequenceDiagram
    actor C as Clinician
    participant U as UI
    participant B as Dashboard API
    participant F as FHIR API
    participant D as database
    Note over B, F: search is cached in redis - it shields a 3rd party API
    Note over C, D: add
    C ->> U: add one from the search results
    U ->> B: the patient id
    Note over C, D: ingest
    B ->> F: that patient's resources
    F -->> B: the resources
    B ->> D: build the database with this patient in it
    D -->> B: ready
    B -->> U: ready
    Note over C, D: display
    U ->> B: the seven panels for that id
    B ->> D: read
    D -->> B: rows
    B -->> U: panels
    U -->> C: their row, and the patient drawn
```

## Full Analytical Procedure

[full_analytical_procedure.md](data_analysis/full_analytical_procedure.md)