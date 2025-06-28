const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  agentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  chatbot_api: {
    type: String,
    required: true
  },
  chatbot_key: {
    type: String,
    required: true
  },
  tts_config: {
    voice_id: {
      type: String,
      required: true
    },
    tts_api_key: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    speed: {
      type: Number,
      required: true,
      min: 0.1,
      max: 2.0
    }
  },
  stt_config: {
    api_key: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    }
  },
  phone_number: {
    type: String,
    sparse: true,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
agentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Agent', agentSchema); 