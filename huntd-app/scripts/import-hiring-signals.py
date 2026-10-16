#!/usr/bin/env python3
"""
Quick import script: fetch jobs from Greenhouse API, filter this week's updates, insert into signals table
"""
import json
import psycopg2
from datetime import datetime, timedelta
import requests

DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'huntd',
    'user': 'root',
    'password': 'password'
}

COMPANIES = [
    {'id': '6beb8dd0-fc88-4121-9e71-0465bf112e7f', 'name': 'Figma', 'slug': 'figma'},
    {'id': 'f9ff4dc2-8e3a-4a4b-a895-88982e04fcbd', 'name': 'Anthropic', 'slug': 'anthropic'}
]

def get_week_start():
    now = datetime.now()
    day = now.weekday()
    week_start = now - timedelta(days=day)
    return week_start.replace(hour=0, minute=0, second=0, microsecond=0)

def fetch_jobs(slug):
    url = f'https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true'
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json().get('jobs', [])

def main():
    week_start = get_week_start()
    print(f'Filtering jobs updated since: {week_start}')

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    total_inserted = 0

    for co in COMPANIES:
        print(f'\n[{co["name"]}] Fetching jobs...')
        jobs = fetch_jobs(co['slug'])
        print(f'  Total jobs: {len(jobs)}')

        for job in jobs:
            updated_at_str = job.get('updated_at')
