{
  "name": "Message",
  "type": "object",
  "properties": {
    "conversation_id": {
      "type": "string"
    },
    "parking_space_id": {
      "type": "string"
    },
    "receiver_id": {
      "type": "string"
    },
    "body": {
      "type": "string"
    },
    "is_quick": {
      "type": "boolean",
      "default": false
    },
    "read": {
      "type": "boolean",
      "default": false
    }
  },
  "required": [
    "conversation_id",
    "body"
  ]
}
