{
  "name": "Vehicle",
  "type": "object",
  "properties": {
    "nickname": {
      "type": "string"
    },
    "make": {
      "type": "string"
    },
    "model": {
      "type": "string"
    },
    "year": {
      "type": "number"
    },
    "license_plate": {
      "type": "string"
    },
    "vehicle_type": {
      "type": "string",
      "enum": [
        "sedan",
        "suv",
        "truck",
        "van",
        "compact",
        "motorcycle",
        "other"
      ]
    },
    "fuel_type": {
      "type": "string",
      "enum": [
        "gas",
        "hybrid",
        "electric"
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
    "length_mm": {
      "type": "number"
    },
    "width_mm": {
      "type": "number"
    },
    "height_mm": {
      "type": "number"
    },
    "is_default": {
      "type": "boolean",
      "default": false
    }
  },
  "required": [
    "make",
    "model",
    "fuel_type"
  ]
}
