require('dotenv').config();
require('./db/connection.js');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const testAuthRoutes = require('./controllers/test-jwt')
const authRoutes = require('./controllers/auth')
const userRoutes = require('./controllers/user');
const expenseRoutes = require("./controllers/expenses.js");
const budgetRoutes = require("./controllers/budgets.js");
const PORT = process.env.PORT || 3009;
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
app.use("/expenses", expenseRoutes);
app.use("/budgets", budgetRoutes);
app.listen(PORT);
