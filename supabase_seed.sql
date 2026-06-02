-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists config (
  id serial primary key,
  data jsonb not null
);

create table if not exists participants (
  id serial primary key,
  team_id int,
  team_name text,
  name text,
  email text,
  enterprise_id text,
  primary_skill text,
  member_type text,
  project_name text,
  project_lead text,
  participation_type text,
  team_members jsonb default '[]',
  registered_at timestamptz,
  password text
);

create table if not exists submissions (
  id serial primary key,
  participant_id int,
  eid text,
  project_title text,
  description text,
  github_url text,
  demo_url text,
  filename text,
  status text,
  submitted_at timestamptz,
  round int,
  use_case text,
  links jsonb default '[]'
);

create table if not exists resources (
  id serial primary key,
  name text,
  filename text,
  description text,
  type text,
  size text,
  uploaded text
);

create table if not exists judges (
  id serial primary key,
  name text,
  username text unique,
  password text,
  round_assignment text
);

create table if not exists criteria (
  id serial primary key,
  key text,
  label text,
  max int,
  tooltip text,
  active boolean default true
);

create table if not exists scores (
  id serial primary key,
  judge_id int,
  judge_name text,
  participant_id int,
  team_name text,
  round int,
  total int,
  status text,
  frozen_at timestamptz,
  score_data jsonb default '{}'
);

-- ── Seed Data ─────────────────────────────────────────────────────────────────

insert into config (id, data) values (1, '{
  "name": "NEU Studio AI Challenge 2026",
  "organiser": "NEU Studio",
  "tagline": "Solving real client problems with the power of AI.",
  "theme": "Open",
  "prize_pool": "RP 5000 pts.",
  "max_team_size": 5,
  "registration_deadline": "2026-04-17T23:59",
  "hackathon_start": "2026-04-20T09:00",
  "hackathon_end": "2025-09-03T23:59:00",
  "submission_deadline": "2026-04-30T23:59",
  "results_date": "2026-05-01",
  "registration_open": true,
  "resources_visible": true,
  "submissions_open": true,
  "round_1_date": "2026-04-24",
  "round_2_date": "2026-05-01",
  "round_2_open": true,
  "criteria_locked": false,
  "round_2_teams": [15, 16, 1, 2, 3],
  "description": "NEU Studio AI Challenge 2026 is our flagship innovation sprint...",
  "eligibility_criteria": "Team Size: 5 MAX\nEmployees at CL6, CL7, CL8 can form a team together.\nEmployees at CL9, CL10, CL11 can form a team together.",
  "use_cases": [
    {"id": 1, "title": "Use case 1", "content": "## 1. Reducing AI Fatigue in Personal Finance Apps\n\n### Industry Context\nReal-world environment where the problem exists.\n\n### Problem Statement\n- Users face friction or inefficiency\n- Current systems are suboptimal\n- Business impact is measurable\n\n### Challenge for Participants\nDesign a GenAI-powered solution addressing the core issue.\n\n### Deliverables\n- UI/UX Prototype\n- AI logic explanation\n- User journey\n- At least 3 KPIs\n"},
    {"id": 2, "title": "Use case 2", "content": "## 2. Fixing Over-Personalization in E-commerce Discovery\n"},
    {"id": 3, "title": "Use case 3", "content": "## 3. Bridging Trust Gap in AI Health Guidance\n"},
    {"id": 4, "title": "Use case 4", "content": ""},
    {"id": 5, "title": "Use case 5", "content": ""}
  ]
}') on conflict (id) do nothing;

insert into judges (id, name, username, password, round_assignment) values
  (1, 'Himanshu', 'himanshu', 'judge123', 'both'),
  (2, 'Deepti', 'deepti', 'judge123', 'both'),
  (3, 'Rahul', 'rahul', 'judge123', 'both'),
  (4, 'Pushkar', 'pushkar', 'judge123', 'round_1')
on conflict (username) do nothing;

insert into criteria (id, key, label, max, tooltip, active) values
  (1, 'ai_usage', 'AI Usage & Innovation', 10, 'Depth, creativity & centrality of AI in the solution', true),
  (2, 'business_impact', 'Business Impact', 10, 'Real-world value, defined users & measurable outcomes', true),
  (3, 'speed_of_delivery', 'Speed of Delivery', 10, 'Deployed, working product within the 10–15 day window', true),
  (4, 'day_plan', '30-60-90 Day Plan', 10, 'Credible roadmap with milestones, owners & metrics', true),
  (5, 'presentation_skills', 'Presentation skills', 20, 'How well the topic is discussed', true)
on conflict do nothing;

insert into participants (id, team_id, team_name, name, email, enterprise_id, primary_skill, member_type, project_name, project_lead, participation_type, team_members, registered_at, password) values
  (1, 1, 'Dunder Mifflin AI', 'Michael Scott', 'michael.scott@company.com', 'EMP-00301', 'Product', 'Team Lead', 'David Wallace', 'Dunder Mifflin', 'team', '[{"name":"Dwight Schrute","enterprise_id":"EMP-00302","primary_skill":"Product","member_type":"Member"},{"name":"Pam Beesly","enterprise_id":"EMP-00303","primary_skill":"Design","member_type":"Member"},{"name":"Jim Halpert","enterprise_id":"EMP-00304","primary_skill":"Engineering","member_type":"Member"}]', '2026-04-17T09:11:20Z', 'Pass123'),
  (2, 2, 'Akatsuki Labs', 'Itachi Uchiha', 'itachi.uchiha@company.com', 'EMP-00401', 'Product', 'Team Lead', 'Sharingan', 'Madara', 'team', '[{"name":"Konan","enterprise_id":"EMP-00402","primary_skill":"Design","member_type":"Member"},{"name":"Kisame Hoshigaki","enterprise_id":"EMP-00403","primary_skill":"Engineering","member_type":"Member"}]', '2026-04-17T09:13:46Z', 'Pass123'),
  (3, 3, 'The Shōgun Protocol', 'Hermione Granger', 'hermione.granger@company.com', 'EMP-00201', 'Product', 'Team Lead', 'The Shōgun Protocol', 'Dumbledore', 'team', '[{"name":"Sherlock Holmes","enterprise_id":"EMP-00202","primary_skill":"Design","member_type":"Member"},{"name":"Lara Croft","enterprise_id":"EMP-00203","primary_skill":"Engineering","member_type":"Member"}]', '2026-04-17T09:16:55Z', 'Pass123'),
  (4, 4, 'Hackers', 'Anuj Bidwai', 'anuj@gmail.com', 'emp1021', 'Product', 'Team Lead', 'Snyops', 'Libha', 'team', '[{"name":"Satyam","enterprise_id":"emp1290","primary_skill":"Product","member_type":"Member"}]', '2026-04-17T09:42:49Z', 'Pass123')
on conflict do nothing;

insert into resources (id, name, filename, description, type, size, uploaded) values
  (1, 'Resource 1776317184546', 'resource_1776317184546.pdf', '', 'PDF', '0.9 MB', '16 Apr')
on conflict do nothing;
