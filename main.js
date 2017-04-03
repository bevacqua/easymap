'use strict'

const apiKey = `$YOUR_GOOGLE_MAPS_API_KEY`
const source = `https://maps.googleapis.com/maps/api/js?libraries=places&key=${ apiKey }`
const geocache = {
  get (place) {
    const serialized = localStorage.getItem(`geocache:${ place.address }`)
    if (serialized) {
      return JSON.parse(serialized)
    }
  },
  set (place, data) {
    return localStorage.setItem(`geocache:${ place.address }`, JSON.stringify(data))
  }
}
contra.concurrent({
  places: next => fetch('data.json')
    .then(res => res.json())
    .then(places => next(null, places))
    .catch(err => next(err)),
  gmaps: next => loadScript(source, next)
}, booted)

function booted (err, result) {
  if (err) {
    throw err
  }
  const { places } = result
  const google = window.google
  const gmaps = google.maps
  const interactiveMapEl = document.querySelector(`.em-map`)

  interactiveMapEl.classList.add(`em-map-opaque`)

  const mapOptions = {
    zoom: 12
  }
  const map = new gmaps.Map(interactiveMapEl, mapOptions)
  const bounds = new gmaps.LatLngBounds()
  const pinkIcon = `http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=+|e92c6c`

  let openedInfoWindow

  contra.each(places, (place, next) =>
    placeMarker(place, pinkIcon, next)
  )

  function placeMarker (place, icon, done) {
    const cached = geocache.get(place)
    if (cached) {
      geolocated(cached)
      return
    }
    fetch(getGeoUrl(place.address))
      .then(res => res.json())
      .then(data => {
        geocache.set(place, data)
        geolocated(data)
      })
      .catch(err => done(err))

    function geolocated (data) {
      const position = parseGeocode(data)
      if (!position) {
        return
      }
      const infoWindow = new gmaps.InfoWindow({
        content: `
          <div>
            <a href='${ place.href }' target='_blank'>${ place.name }</a>
            <div>${ place.address }</div>
          </div>
        `
      })
      const marker = new gmaps.Marker({
        map,
        position,
        title: place.name,
        icon
      })
      bounds.extend(marker.position)
      map.fitBounds(bounds)
      gmaps.event.addListener(marker, `click`, reveal)
      gmaps.event.addListener(infoWindow, `closeclick`, closing)
      done()
      function closing () {
        if (openedInfoWindow) {
          openedInfoWindow.close()
          openedInfoWindow = null
        }
      }
      function reveal () {
        closing()
        infoWindow.open(map, marker)
        openedInfoWindow = infoWindow
      }
    }
  }
}

function getGeoUrl (address) {
  return `https://maps.googleapis.com/maps/api/geocode/json?address=${ address }&key=${ apiKey }`
}

function parseGeocode (body) {
  if (body.status !== `OK`) {
    return null
  }
  const {
      results: [{
      geometry: {
        location: { lat, lng }
      }
    }]
  } = body

  return { lat, lng }
}


function loadScript (url, options, done) {
  const tag = `script`
  if (typeof options === `function`) {
    done = options
    options = {}
  } else if (!options) {
    options = {}
  }
  let first
  const script = document.createElement(tag)
  script.async = true
  script.src = url
  if (done) { script.onload = success; script.onerror = error }
  if (options.id) { script.id = options.id }
  if (options.container) {
    options.container.insertBefore(script, options.container.firstChild)
  } else {
    first = document.getElementsByTagName(`link`)[0]
    first.parentNode.insertBefore(script, first)
  }
  return script
  function success () {
    done()
  }
  function error () {
    done(new Error(`Error loading script: ` + url))
  }
}
