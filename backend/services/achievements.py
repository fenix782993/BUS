def unlocked(metric,target,player): return {"jobs":player.jobs_completed,"earned":int(player.total_earned),"level":player.level}.get(metric,0)>=target
