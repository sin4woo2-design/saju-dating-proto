# Compatibility Warning/Confidence Distribution Report

Golden case fixture 기반 분포 리포트입니다.

- Total cases: **12**
- Score range: **65 ~ 77**
- Avg score: **73.33**
- PROVIDER_PARTIAL_DATA rate: **33.3%**

## Confidence distribution

- high: 8
- low: 4

## Warning distribution

- PROVIDER_PARTIAL_DATA: 4

## Case results

| case | score | confidence | warnings |
|---|---:|---|---|
| golden-01-high-known-known | 77 | high | - |
| golden-02-known-unknown | 69 | low | PROVIDER_PARTIAL_DATA |
| golden-03-unknown-known | 70 | low | PROVIDER_PARTIAL_DATA |
| golden-04-unknown-unknown | 65 | low | PROVIDER_PARTIAL_DATA |
| golden-05-midnight-boundary-a | 77 | high | - |
| golden-06-midnight-boundary-b | 76 | high | - |
| golden-07-season-boundary-a | 76 | high | - |
| golden-08-season-boundary-b | 72 | high | - |
| golden-09-utc-known-known | 77 | high | - |
| golden-10-mixed-gender-other | 74 | high | - |
| golden-11-known-unknown-utc | 70 | low | PROVIDER_PARTIAL_DATA |
| golden-12-symmetric-stability | 77 | high | - |
