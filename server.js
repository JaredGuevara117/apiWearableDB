require('dotenv').config();
const express = require('express');
const { connectToDB, getDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Conexión a la base de datos
connectToDB(err => {
    if (err) {
        console.error('Failed to connect to MongoDB');
        process.exit(1);
    }
    
    console.log('Successfully connected to MongoDB');
    
    // Iniciar servidor solo después de conectar a MongoDB
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});

// Rutas
app.get('/', (req, res) => {
    res.send('Wearable Data API - Ready');
});


// Endpoint para obtener datos
app.get('/api/sensor-data', async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('sensorData');
        
        const data = await collection.find().sort({ timestamp: -1 }).toArray();
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sensor data'
        });
    }
});

// Endpoint para guardar/actualizar datos del sensor
app.post('/api/sensor-data', async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('sensorData');
        
        const { deviceId, heartRate, accelerometer, gyroscope, steps } = req.body;
        
        if (!deviceId) {
            return res.status(400).json({ error: 'deviceId is required' });
        }

        // Buscar documento existente
        const existingData = await collection.findOne({ deviceId });
        
        // Si no existe, crear uno nuevo
        if (!existingData) {
            const newData = {
                deviceId,
                heartRate,
                accelerometer,
                gyroscope,
                steps,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const result = await collection.insertOne(newData);
            return res.status(201).json({
                success: true,
                message: 'New session created',
                insertedId: result.insertedId
            });
        }
        
        // Actualizar solo los campos proporcionados
        const updateFields = { updatedAt: new Date() };
        
        if (heartRate !== undefined) updateFields.heartRate = heartRate;
        if (accelerometer !== undefined) updateFields.accelerometer = accelerometer;
        if (gyroscope !== undefined) updateFields.gyroscope = gyroscope;
        if (steps !== undefined) updateFields.steps = steps;
        
        const result = await collection.updateOne(
            { _id: existingData._id },
            { $set: updateFields }
        );
        
        res.status(200).json({
            success: true,
            message: 'Data updated successfully',
            updatedId: existingData._id
        });
    } catch (error) {
        console.error('Error saving sensor data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save sensor data'
        });
    }
});

// Endpoint para actualizar solo el ritmo cardíaco
app.patch('/api/sensor-data/heart-rate', async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('sensorData');
        
        const { deviceId, heartRate } = req.body;
        
        if (!deviceId || heartRate === undefined) {
            return res.status(400).json({ error: 'deviceId and heartRate are required' });
        }

        const result = await collection.updateOne(
            { deviceId },
            { $set: { heartRate, updatedAt: new Date() } },
            { upsert: true }  // Crear si no existe
        );
        
        res.status(200).json({
            success: true,
            message: result.upsertedId ? 'New session created' : 'Heart rate updated',
            [result.upsertedId ? 'insertedId' : 'updatedId']: 
                result.upsertedId || result.modifiedCount
        });
    } catch (error) {
        console.error('Error updating heart rate:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update heart rate'
        });
    }
});

// Endpoint para actualizar solo el acelerómetro
app.patch('/api/sensor-data/accelerometer', async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('sensorData');
        
        const { deviceId, accelerometer } = req.body;
        
        if (!deviceId || !accelerometer) {
            return res.status(400).json({ error: 'deviceId and accelerometer are required' });
        }

        const result = await collection.updateOne(
            { deviceId },
            { $set: { accelerometer, updatedAt: new Date() } },
            { upsert: true }
        );
        
        res.status(200).json({
            success: true,
            message: result.upsertedId ? 'New session created' : 'Accelerometer data updated',
            [result.upsertedId ? 'insertedId' : 'updatedId']: 
                result.upsertedId || result.modifiedCount
        });
    } catch (error) {
        console.error('Error updating accelerometer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update accelerometer'
        });
    }
});

// Endpoint para actualizar solo el giroscopio
app.patch('/api/sensor-data/gyroscope', async (req, res) => {
    try {
        const { deviceId, gyroscope } = req.body;
        
        if (!deviceId || !gyroscope) {
            return res.status(400).json({ error: 'deviceId and gyroscope are required' });
        }

        // Asegurar que los valores sean números
        const x = parseFloat(gyroscope.x);
        const y = parseFloat(gyroscope.y);
        const z = parseFloat(gyroscope.z);
        
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            return res.status(400).json({ error: 'Invalid gyroscope values' });
        }

        // Actualizar en base de datos
        const result = await collection.updateOne(
            { deviceId },
            { $set: { 
                "gyroscope.x": x,
                "gyroscope.y": y,
                "gyroscope.z": z,
                updatedAt: new Date() 
            }},
            { upsert: true }
        );
        
        res.status(200).json({
            success: true,
            message: result.upsertedId ? 'New session created' : 'Gyroscope data updated',
            [result.upsertedId ? 'insertedId' : 'updatedId']: 
                result.upsertedId || result.modifiedCount
        });
    } catch (error) {
        console.error('Error updating gyroscope:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update gyroscope'
        });
    }
});

// Endpoint para actualizar solo los pasos
app.patch('/api/sensor-data/steps', async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('sensorData');
        
        const { deviceId, steps } = req.body;
        
        if (!deviceId || steps === undefined) {
            return res.status(400).json({ error: 'deviceId and steps are required' });
        }

        const result = await collection.updateOne(
            { deviceId },
            { $set: { steps, updatedAt: new Date() } },
            { upsert: true }
        );
        
        res.status(200).json({
            success: true,
            message: result.upsertedId ? 'New session created' : 'Steps updated',
            [result.upsertedId ? 'insertedId' : 'updatedId']: 
                result.upsertedId || result.modifiedCount
        });
    } catch (error) {
        console.error('Error updating steps:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update steps'
        });
    }
});
