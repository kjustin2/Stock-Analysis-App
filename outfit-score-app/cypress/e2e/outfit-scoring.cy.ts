/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />
/// <reference types="cypress-file-upload" />

describe('Outfit Scoring Application', () => {
  beforeEach(() => {
    cy.visit('/')
    // Wait for initial load and models to be ready
    cy.get('h1', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="model-loading"]', { timeout: 10000 }).should('exist')
    cy.get('[data-testid="model-loading"]', { timeout: 10000 }).should('not.exist')
  })

  it('displays the main title', () => {
    cy.get('h1').should('contain', 'Outfit Style Scorer')
  })

  it('allows image upload and displays score', () => {
    // Upload image
    cy.fixture('sample-outfit.jpg', 'base64').then((base64Content) => {
      cy.get('[data-testid="file-input"]').attachFile({
        fileContent: base64Content,
        fileName: 'sample-outfit.jpg',
        mimeType: 'image/jpeg',
        encoding: 'base64'
      })
    })
    
    // Check results
    cy.get('[data-testid="outfit-score"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="score"]').should('contain', '/100')
  })

  it('handles invalid file types', () => {
    // Upload invalid file
    cy.get('[data-testid="file-input"]').attachFile({
      fileContent: new Blob(['test content'], { type: 'text/plain' }),
      fileName: 'test.txt',
      mimeType: 'text/plain'
    })
    
    // Wait for error message and check its content
    cy.get('[data-testid="error-message"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Please upload an image file')
  })

  it('shows loading state during analysis', () => {
    // Upload image
    cy.fixture('sample-outfit.jpg', 'base64').then((base64Content) => {
      cy.get('[data-testid="file-input"]').attachFile({
        fileContent: base64Content,
        fileName: 'sample-outfit.jpg',
        mimeType: 'image/jpeg',
        encoding: 'base64'
      })
    })
    
    // Check loading state appears
    cy.get('[data-testid="loading-indicator"]', { timeout: 10000 }).should('be.visible')
    
    // Wait for loading state to disappear and score to appear
    cy.get('[data-testid="loading-indicator"]', { timeout: 10000 }).should('not.exist')
    cy.get('[data-testid="outfit-score"]', { timeout: 10000 }).should('be.visible')
  })

  it('provides detailed style feedback', () => {
    // Upload image
    cy.fixture('sample-outfit.jpg', 'base64').then((base64Content) => {
      cy.get('[data-testid="file-input"]').attachFile({
        fileContent: base64Content,
        fileName: 'sample-outfit.jpg',
        mimeType: 'image/jpeg',
        encoding: 'base64'
      })
    })
    
    // Check style breakdown
    cy.get('[data-testid="style-breakdown"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="style-consistency"]').should('be.visible')
    cy.get('[data-testid="color-harmony"]').should('be.visible')
    cy.get('[data-testid="formality"]').should('be.visible')
    cy.get('[data-testid="layering"]').should('be.visible')
    cy.get('[data-testid="proportions"]').should('be.visible')
  })

  it('is responsive across different viewports', () => {
    const viewports = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 768, height: 1024 }, // iPad
      { width: 1280, height: 800 }, // Desktop
    ]

    viewports.forEach(({ width, height }) => {
      cy.viewport(width, height)
      cy.get('[data-testid="dropzone"]').should('be.visible')
      cy.get('[data-testid="choose-image-button"]').should('be.visible')
    })
  })
}) 