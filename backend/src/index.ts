import { app } from './app';
import { config } from './lib/config';

app.listen(config.PORT, () => {
  console.log(`Backend listening on http://localhost:${config.PORT} (${config.NODE_ENV})`);
});
