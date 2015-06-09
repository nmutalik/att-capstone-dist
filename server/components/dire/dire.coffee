# Dire

gm = require 'googlemaps'
polyline = require 'polyline-encoded'

simulation_speed = 20.0

# if process.argv.length > 2
#  simulation_speed = parseFloat process.argv[2]

waypoints = []
current = undefined
next = undefined
remaining_distance = 0.0
EPSILON = 0.0000001

distance = (a, b) -> Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2))
chomp = (a, b) ->
  return 0 if a - b < 0
  a - b

compute_loc = (c, n, d) ->
  dlat = n.lat - c.lat
  dlng = n.lng - c.lng
  totl = distance(c, n)
  ulat = dlat / totl
  ulng = dlng / totl
  ret =
    lat: c.lat + ulat * (totl - d)
    lng: c.lng + ulng * (totl - d)
  ret

sim_interval = undefined

sim = ->
  while remaining_distance <= 0
    current = next
    next = waypoints.shift()
    if next is undefined
      clearInterval sim_interval
      return
    remaining_distance = distance(current, next)
  
  remaining_distance = chomp(remaining_distance, simulation_speed / 1000)
  console.log JSON.stringify(compute_loc(current, next, remaining_distance))

process.stdin.setEncoding 'utf8'

accum = ""

process.stdin.on 'readable', ->
  chunk = process.stdin.read()
  accum += chunk if chunk isnt null

gather_and_start = (err, data) ->
  process.exit 1 if data.status is "NOT_FOUND" or data.statu is "ZERO_RESULTS"
  first = false
  for step in data.routes[0].legs[0].steps
    if first is false
      next = step.start_location
      first = true
      continue
    latlngs = polyline.decode step.polyline.points
    for latlng in latlngs
      waypoints.push
        lat: latlng[0]
        lng: latlng[1]
  
  sim_interval = setInterval(sim, 2000)

process.stdin.on 'end', ->
  input = JSON.parse(accum)
  gm.directions "#{input.a.lat},#{input.a.lng}", "#{input.b.lat},#{input.b.lng}", gather_and_start
  