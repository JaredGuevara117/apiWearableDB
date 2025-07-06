const mongoose = require('mongoose');

const accelerometerSchema = new mongoose.Schema({
    x: Number,
    y: Number,
    z: Number
});

const gyroscopeSchema = new mongoose.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
}, { _id: false });

const sensorDataSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    heartRate: Number,
    accelerometer: accelerometerSchema,
    gyroscope: gyroscopeSchema,
    steps: Number,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
