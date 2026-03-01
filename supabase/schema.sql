-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  full_name text,
  phone_number text,
  avatar_url text,
  is_setup_finished boolean default false,

  updated_at timestamp with time zone,
  constraint username_length check (char_length(username) >= 3)
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for addresses
create table addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  address_name text, -- e.g. 'Home', 'Work'
  recipient_name text,
  recipient_phone text,
  zonecode text,
  road_address text not null,
  detail_address text,
  is_default boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for addresses
alter table addresses enable row level security;

create policy "Users can view their own addresses." on addresses
  for select using (auth.uid() = user_id);

create policy "Users can insert their own addresses." on addresses
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own addresses." on addresses
  for update using (auth.uid() = user_id);

create policy "Users can delete their own addresses." on addresses
  for delete using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone_number, username, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
