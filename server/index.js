const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// זה מחבר אותנו לדאטה בייס בצורה וירטואלית
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/', (req, res) => res.send('Server is Running! 🚀'));

app.listen(port, () => console.log(`Server running on port ${port}`));