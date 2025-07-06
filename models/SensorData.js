const mongoose = require('mongoose');

const accelerometerSchema = new mongoose.Schema({
    x: Number,
    y: Number,
    z: Number
});

const gyroscopeSchema = new mongoose.Schema({
    x: Number,
    y: Number,
    z: Number
});

const sensorDataSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    heartRate: Number,
    accelerometer: accelerometerSchema,
    gyroscope: gyroscopeSchema,
    steps: Number,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);