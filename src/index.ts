import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

import authRouter from "./routes/auth.route.js"
app.use("/api/v1/auth", authRouter)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});