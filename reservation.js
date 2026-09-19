{
  "name": "Reservation",
  "type": "object",
  "properties": {
    "parking_space_id": {
      "type": "string"
    },
    "parking_space_title": {
      "type": "string"
    },
    "parking_space_address": {
      "type": "string"
    },
    "parking_space_lat": {
      "type": "number"
    },
    "parking_space_lng": {
      "type": "number"
    },
    "vehicle_id": {
      "type": "string"
    },
    "vehicle_label": {
      "type": "string"
    },
    "start_time": {
      "type": "string",
      "format": "date-time"
    },
    "end_time": {
      "type": "string",
      "format": "date-time"
    },
    "duration_hours": {
      "type": "number"
    },
    "status": {
      "type": "string",
      "enum": [
        "upcoming",
        "active",
        "completed",
        "cancelled"
      ],
      "default": "upcoming"
    },
    "has_charging": {
      "type": "boolean",
      "default": false
    },
    "parking_total": {
      "type": "number"
    },
    "charging_total": {
      "type": "number"
    },
    "service_fee": {
      "type": "number"
    },
    "taxes": {
      "type": "number"
    },
    "total": {
      "type": "number"
    },
    "host_instructions": {
      "type": "string"
    },
    "parking_photo": {
      "type": "string"
    },
    "entrance_photo": {
      "type": "string"
    }
  },
  "required": [
    "parking_space_id",
    "start_time",
    "end_time",
    "status",
    "total"
  ]
}
