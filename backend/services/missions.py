def progress_for(metric,player): return {"jobs":player.jobs_completed,"earned":int(player.total_earned),"level":player.level}.get(metric,0)
