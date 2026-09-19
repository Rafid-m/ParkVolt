{
  "name": "Review",
  "type": "object",
  "properties": {
    "reservation_id": {
      "type": "string"
    },
    "parking_space_id": {
      "type": "string"
    },
    "rating": {
      "type": "number"
    },
    "easy_to_find": {
      "type": "number"
    },
    "accuracy": {
      "type": "number"
    },
    "space_quality": {
      "type": "number"
    },
    "access": {
      "type": "number"
    },
    "value": {
      "type": "number"
    },
    "charger_reliability": {
      "type": "number"
    },
    "comment": {
      "type": "string"
    }
  },
  "required": [
    "parking_space_id",
    "rating"
  ]
}
