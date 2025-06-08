/// <reference types="cypress" />
import '@testing-library/cypress/add-commands';
import 'cypress-file-upload';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to upload an image file
       * @example cy.uploadImage('test.jpg')
       */
      uploadImage(fileName: string): Chainable<Element>;

      /**
       * Custom command to wait for score calculation
       * @example cy.waitForScore()
       */
      waitForScore(): Chainable<Element>;

      /**
       * Custom command to check style breakdown
       * @example cy.checkStyleBreakdown()
       */
      checkStyleBreakdown(): Chainable<Element>;

      /**
       * Custom command to clear uploaded image
       * @example cy.clearUploadedImage()
       */
      clearUploadedImage(): Chainable<Element>;

      /**
       * Custom command to upload a file
       * @example cy.uploadFile('selector', 'fileName')
       */
      uploadFile(selector: string, fileName: string): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('uploadImage', (fileName: string) => {
  cy.fixture(fileName, 'binary')
    .then(Cypress.Blob.binaryStringToBlob)
    .then(fileContent => {
      cy.get('[data-testid="dropzone"]').attachFile({
        fileContent,
        fileName,
        mimeType: 'image/jpeg'
      });
    });
});

Cypress.Commands.add('waitForScore', () => {
  return cy.get('[data-testid="score"]', { timeout: 10000 })
    .should('exist')
    .should('not.be.empty');
});

Cypress.Commands.add('checkStyleBreakdown', () => {
  return cy.get('[data-testid="style-breakdown"]', { timeout: 10000 })
    .should('exist')
    .within(() => {
      cy.get('[data-testid="style-consistency"]').should('exist');
      cy.get('[data-testid="color-harmony"]').should('exist');
      cy.get('[data-testid="formality"]').should('exist');
      cy.get('[data-testid="layering"]').should('exist');
      cy.get('[data-testid="proportions"]').should('exist');
    });
});

Cypress.Commands.add('clearUploadedImage', () => {
  return cy.get('[data-testid="clear-button"]')
    .should('exist')
    .click()
    .then(() => {
      cy.get('[data-testid="dropzone"]').should('exist');
      cy.get('[data-testid="score"]').should('not.exist');
    });
});

Cypress.Commands.add('uploadFile', (selector: string, fileName: string) => {
  cy.get(selector).attachFile(fileName);
}); 