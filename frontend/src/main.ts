import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { UserService } from './app/core/services/user'; // 1. Import the UserService

bootstrapApplication(App, appConfig)
  .then(appRef => {
    // 2. TEMPORARY DEBUGGING: Make the service available on the window object
    const userService = appRef.injector.get(UserService);
    (window as any).userService = userService;
  })
  .catch((err) => console.error(err));