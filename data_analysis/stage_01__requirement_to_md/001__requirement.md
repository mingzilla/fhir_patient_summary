# Software Engineer Technical Assessment — Patient Data Summarisation Prototype

## Overview

This assessment is designed to evaluate your ability to work with healthcare data standards, build functional prototypes, and make pragmatic technology choices under real-world constraints.

You will be given a local FHIR server pre-loaded with synthetic patient data. Your task is to build a prototype application that retrieves patient records from this server and produces meaningful, human-readable summaries of the clinical information contained within them.

We are interested in how you approach the problem as much as the final output. There is no single correct solution — we want to see your reasoning, your choice of tools and techniques, and how you handle the messy reality of healthcare data.

## The Brief

Build a prototype application that connects to a local FHIR R4 server, retrieves patient data, and generates useful summaries of that data. The summaries should be understandable by a non-technical audience, such as a clinician reviewing a patient's record at a glance.

## Environment Setup

A Docker image is provided containing a HAPI FHIR server pre-loaded with Synthea-generated patient data. To start the server, run:

```bash
docker run -it -p 8080:8080 smartonfhir/hapi-5:r4-synthea
```

Once running, the FHIR base URL is:

```
http://localhost:8080/hapi-fhir-jpaserver/fhir
```

You can verify the server is working by retrieving patient records:

```
http://localhost:8080/hapi-fhir-jpaserver/fhir/Patient
```

The server exposes a standard FHIR R4 API. You are free to query any resources available (Patient, Condition, Observation, MedicationRequest, Encounter, AllergyIntolerance, Procedure, etc.). The FHIR specification at [hl7.org/fhir](https://hl7.org/fhir) is the authoritative reference if you need to understand resource structures.

## Requirements

1. Connect to the local FHIR server and retrieve patient data programmatically.
2. Generate a summary for at least one patient that synthesises information from multiple FHIR resource types into a coherent, readable narrative or structured overview.
3. Handle the volume and variability of the data sensibly — patients may have dozens of conditions, hundreds of observations, and years of encounter history.
4. Present the summary in a usable format (could be a web interface, a CLI output, a generated document, or anything else you consider appropriate).

## Scope and Constraints

- You may use any programming language, framework, library, or external service you wish.
- You may use any approach to generating the summaries — use the opportunity to showcase your knowledge!
- The solution does not need to be production-ready, but it should demonstrate sound engineering judgement.
- You are not expected to build a complete clinical system. A focused, well-executed prototype that clearly demonstrates your approach is preferable to a sprawling, half-finished application.

## Deliverables

1. A Git repository (or archive) containing your source code.
2. A README file that includes:
   - Instructions for running your solution
   - A brief explanation of your approach and the technology choices you made
   - Any assumptions or limitations you are aware of
   - Roughly how long you spent on the exercise
3. Example output — at least one patient summary produced by your prototype (included in the repository or described in the README).

## Time Guidance

We recommend spending approximately 3–4 hours on this exercise. If you find yourself running significantly over this time, consider narrowing your scope and documenting what you would do with more time rather than trying to complete everything. We would much rather see a well-considered, clearly documented prototype that covers a narrow slice of the problem than a rushed attempt to cover everything.