import 'dotenv/config';
import app from './app';

const PORT = Number(process.env.PORT) || 10000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server is running beautifully on http://${HOST}:${PORT}`);
});
