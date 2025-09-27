import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] }));

const database = require("./config/database");
database.connect();

const routeAdmin = require("./routes/admin/index.route");
routeAdmin(app);

const routeClient = require("./routes/client/index.route");
routeClient(app)

const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
