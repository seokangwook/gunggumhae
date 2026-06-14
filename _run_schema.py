#!/usr/bin/env python3
"""Supabase Management API로 schema.sql 실행"""

import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

PROJECT_REF = "yiduavoxineujidorcbx"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZHVhdm94aW5ldWppZG9yY2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU0MTgzMCwiZXhwIjoyMDkyMTE3ODMwfQ.5r38JxvGmNA2gV4Lyt-GzSuGvm3oL3MxuO7y6BvX4BE"

SQL = """
create table if not exists public.gunggumhae_polls (
  id                   uuid primary key default gen_random_uuid(),
  creator_user         uuid references auth.users not null,
  title                text not null check (length(title) <= 200),
  description          text check (length(description) <= 1000),
  options              jsonb not null,
  is_anonymous         boolean default true,
  collect_demographics boolean default true,
  scheduled_at         timestamptz,
  status               text check (status in ('draft','scheduled','open','closed')) default 'draft',
  total_votes          int default 0,
  created_at           timestamptz default now(),
  closes_at            timestamptz
);

alter table public.gunggumhae_polls enable row level security;

create policy "polls_public_read" on public.gunggumhae_polls
  for select using (status != 'draft');

create policy "polls_creator_read_own" on public.gunggumhae_polls
  for select using (auth.uid() = creator_user);

create policy "polls_insert_auth" on public.gunggumhae_polls
  for insert with check (auth.uid() = creator_user);

create policy "polls_update_own" on public.gunggumhae_polls
  for update using (auth.uid() = creator_user);

create index if not exists gunggumhae_polls_status_idx
  on public.gunggumhae_polls (status, created_at desc);
create index if not exists gunggumhae_polls_creator_idx
  on public.gunggumhae_polls (creator_user);

create table if not exists public.gunggumhae_votes (
  id                    uuid primary key default gen_random_uuid(),
  poll_id               uuid references public.gunggumhae_polls on delete cascade not null,
  voter_user            uuid references auth.users not null,
  selected_option_index int not null,
  gender                text check (gender in ('male','female','other','skip')),
  age_band              text check (age_band in ('10s','20s','30s','40s','50s','60s+','skip')),
  voted_at              timestamptz default now(),
  unique(poll_id, voter_user)
);

alter table public.gunggumhae_votes enable row level security;

create policy "votes_auth_read" on public.gunggumhae_votes
  for select using (auth.uid() is not null);

create policy "votes_insert_auth" on public.gunggumhae_votes
  for insert with check (auth.uid() = voter_user);

create index if not exists gunggumhae_votes_poll_idx
  on public.gunggumhae_votes (poll_id);
create index if not exists gunggumhae_votes_voter_idx
  on public.gunggumhae_votes (voter_user);

create table if not exists public.gunggumhae_allowlist (
  user_id       uuid primary key references auth.users,
  added_by      uuid references auth.users,
  added_at      timestamptz default now(),
  auto_approved boolean default false,
  notes         text
);

alter table public.gunggumhae_allowlist enable row level security;

create policy "allowlist_self_read" on public.gunggumhae_allowlist
  for select using (auth.uid() = user_id);

create table if not exists public.gunggumhae_supporters (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users not null,
  tier                text check (tier in ('bronze','silver','gold')) not null,
  amount_krw          int not null,
  paid_at             timestamptz default now(),
  expires_at          timestamptz,
  ads_disabled_until  timestamptz
);

alter table public.gunggumhae_supporters enable row level security;

create policy "supporters_self_read" on public.gunggumhae_supporters
  for select using (auth.uid() = user_id);

create or replace function public.increment_poll_votes(poll_id uuid)
returns void
language sql
security definer
as $$
  update public.gunggumhae_polls
  set total_votes = total_votes + 1
  where id = poll_id;
$$;
"""

def run_sql():
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    body = json.dumps({"query": SQL}).encode("utf-8")
    req = urllib.request.Request(
        url, data=body,
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode("utf-8")
            print(f"✅ 성공: {text[:300]}")
    except urllib.error.HTTPError as e:
        body_str = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {body_str[:500]}")


if __name__ == "__main__":
    print("=== Supabase schema.sql 실행 ===")
    run_sql()
