const https = require('https');
const express = require('express');
const fs = require('fs');
require('dotenv').config();
require('./db/connection.js');
const cors = require('cors');
const morgan = require('morgan');
const testAuthRoutes = require('./controllers/test-jwt')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users.js');
const adminController = require('./controllers/admin');
const chatRoutes = require('./routes/chat');



const PORT = process.env.PORT || 3000;
const app = express();



app.use(cors());
app.use(express.json());
app.use(morgan('dev'));



app.get("/", (req, res) => {
	res.status(201).json({
		message: "This is the home route",
	});
});

app.use('/test-jwt', testAuthRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/chat', chatRoutes);
app.use('/admin', adminController);


// const SECURE_PORT = 4334;
// const key = fs.readFileSync(process.env.SSL_KEY);
// const cert = fs.readFileSync(process.env.SSL_CERT);
// const options = { key, cert };
// const server = https.createServer(options, app);
// server.listen(SECURE_PORT, () => console.log(`Encrypted Server Running on port ${SECURE_PORT}. Access at`, [ `https://localhost:${SECURE_PORT}` ]));
app.listen(PORT, () => console.log(`UnEncrypted Server Running on port ${PORT}. Access at`, [ `http://localhost:${PORT}` ]));
