-- 궁금해 (Gunggumhae) DB Schema
-- Supabase SQL Editor에서 실행

-- ============================================================
-- 1. 투표 (polls)
-- ============================================================
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

-- 공개된 투표는 누구나 읽기 가능
create policy "polls_public_read" on public.gunggumhae_polls
  for select using (status != 'draft');

-- draft 포함 본인 투표 읽기
create policy "polls_creator_read_own" on public.gunggumhae_polls
  for select using (auth.uid() = creator_user);

-- 생성: allowlist 사용자만 (allowlist 체크는 API에서 처리)
create policy "polls_insert_auth" on public.gunggumhae_polls
  for insert with check (auth.uid() = creator_user);

-- 수정: 본인만
create policy "polls_update_own" on public.gunggumhae_polls
  for update using (auth.uid() = creator_user);

-- 인덱스
create index if not exists gunggumhae_polls_status_idx
  on public.gunggumhae_polls (status, created_at desc);
create index if not exists gunggumhae_polls_creator_idx
  on public.gunggumhae_polls (creator_user);

-- ============================================================
-- 2. 투표 기록 (votes)
-- ============================================================
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

-- 투표 결과는 로그인 사용자가 읽기 가능 (참여 후 인구통계 확인 목적)
create policy "votes_auth_read" on public.gunggumhae_votes
  for select using (auth.uid() is not null);

-- 본인만 삽입 가능
create policy "votes_insert_auth" on public.gunggumhae_votes
  for insert with check (auth.uid() = voter_user);

create index if not exists gunggumhae_votes_poll_idx
  on public.gunggumhae_votes (poll_id);
create index if not exists gunggumhae_votes_voter_idx
  on public.gunggumhae_votes (voter_user);

-- ============================================================
-- 3. Creator Allowlist
-- ============================================================
create table if not exists public.gunggumhae_allowlist (
  user_id       uuid primary key references auth.users,
  added_by      uuid references auth.users,
  added_at      timestamptz default now(),
  auto_approved boolean default false,
  notes         text
);

alter table public.gunggumhae_allowlist enable row level security;

-- 본인 allowlist 상태 확인
create policy "allowlist_self_read" on public.gunggumhae_allowlist
  for select using (auth.uid() = user_id);

-- ============================================================
-- 4. 응원 (supporters)
-- ============================================================
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

-- ============================================================
-- 5. total_votes 증가 함수 (atomic)
-- ============================================================
create or replace function public.increment_poll_votes(poll_id uuid)
returns void
language sql
security definer
as $$
  update public.gunggumhae_polls
  set total_votes = total_votes + 1
  where id = poll_id;
$$;

-- ============================================================
-- 6. 자동 종료 (closes_at 지난 투표를 closed로)
-- 수동 버튼 방식 — cron 없음, API 레이어에서 상태 처리
-- 필요 시 운영자가 직접 status='closed'로 업데이트
-- ============================================================
