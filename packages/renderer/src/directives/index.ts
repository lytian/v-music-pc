/**
 * Configure and register global directives
 */
import type { App } from 'vue';
import titleDirective from './title';

export function setupGlobDirectives(app: App) {
  app.directive('title', titleDirective);
}
