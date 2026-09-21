def metric_value(metric, player, vehicles=0, companies=0):
    return {'jobs': player.jobs_completed, 'earned': int(player.total_earned), 'level': player.level, 'vehicles': vehicles, 'companies': companies}.get(metric, 0)

def unlocked(metric, target, player, vehicles=0, companies=0):
    return metric_value(metric, player, vehicles, companies) >= target
