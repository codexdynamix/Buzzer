import { register } from 'tsx/esm/api';

register();
import('./server.ts').catch(err => {
  console.error('Failed to load Buzzer server:', err);
  process.exitCode = 1;
});