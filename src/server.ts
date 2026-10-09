import { createApp } from './app';
import { Config } from './config/config';

const config = Config.getInstance();

const app = createApp();

app.listen(config.PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${config.PORT}`);
});
