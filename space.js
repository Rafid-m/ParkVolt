{
  "name": "ParkingSpace",
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "address": {
      "type": "string"
    },
    "lat": {
      "type": "number"
    },
    "lng": {
      "type": "number"
    },
    "neighborhood": {
      "type": "string"
    },
    "zip": {
      "type": "string"
    },
    "parking_type": {
      "type": "string",
      "enum": [
        "driveway",
        "garage",
        "lot",
        "covered",
        "commercial",
        "other"
      ]
    },
    "covered": {
      "type": "boolean",
      "default": false
    },
    "length_mm": {
      "type": "number"
    },
    "width_mm": {
      "type": "number"
    },
    "height_clearance_mm": {
      "type": "number"
    },
    "entrance_width_mm": {
      "type": "number"
    },
    "max_vehicle_size": {
      "type": "string",
      "enum": [
        "compact",
        "sedan",
        "suv",
        "truck",
        "any"
      ]
    },
    "access_24_7": {
      "type": "boolean",
      "default": false
    },
    "overnight_allowed": {
      "type": "boolean",
      "default": true
    },
    "security_camera": {
      "type": "boolean",
      "default": false
    },
    "gated": {
      "type": "boolean",
      "default": false
    },
    "instant_booking": {
      "type": "boolean",
      "default": true
    },
    "verified": {
      "type": "boolean",
      "default": false
    },
    "has_ev_charging": {
      "type": "boolean",
      "default": false
    },
    "charger_level": {
      "type": "string",
      "enum": [
        "none",
        "level_1",
        "level_2",
        "dc_fast"
      ]
    },
    "connector": {
      "type": "string",
      "enum": [
        "none",
        "nacs",
        "ccs",
        "chademo",
        "j1772",
        "tesla"
      ]
    },
    "max_kw": {
      "type": "number"
    },
    "charging_price_kwh": {
      "type": "number"
    },
    "num_chargers": {
      "type": "number",
      "default": 0
    },
    "hourly_price": {
      "type": "number"
    },
    "daily_price": {
      "type": "number"
    },
    "weekly_price": {
      "type": "number"
    },
    "monthly_price": {
      "type": "number"
    },
    "overnight_price": {
      "type": "number"
    },
    "photos": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "host_instructions": {
      "type": "string"
    },
    "rating": {
      "type": "number",
      "default": 0
    },
    "num_reviews": {
      "type": "number",
      "default": 0
    },
    "status": {
      "type": "string",
      "enum": [
        "active",
        "paused",
        "pending"
      ],
      "default": "active"
    },
    "host_name": {
      "type": "string"
    },
    "host_rating": {
      "type": "number",
      "default": 0
    }
  },
  "required": [
    "title",
    "address",
    "lat",
    "lng",
    "parking_type",
    "hourly_price"
  ]
}
