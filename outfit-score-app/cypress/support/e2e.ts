/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />
/// <reference types="cypress-file-upload" />
/// <reference types="jquery" />

import 'cypress-file-upload';
import '@testing-library/cypress/add-commands';

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.getByTestId('greeting')
       */
      getByTestId(value: string): Chainable<JQuery<HTMLElement>>;
    }

    interface Window {
      Blob: typeof Blob;
    }
  }
}

// Custom command for selecting elements by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
}); 