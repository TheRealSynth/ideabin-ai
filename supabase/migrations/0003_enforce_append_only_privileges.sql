revoke all privileges on table
  public.idea_versions,
  public.evaluations,
  public.ai_runs
from authenticated;

grant select, insert on table
  public.idea_versions,
  public.evaluations,
  public.ai_runs
to authenticated;
