Feature: Login

  # Background uses cy.session(cacheAcrossSpecs: true) so the configured login
  # runs exactly ONCE. All subsequent specs (department, role, user, messageTemplate)
  # restore the same cached session — no re-login, no 401.
  Background:
    Given the user is logged in and on the home page

  @AS_001 @login @smoke
  Scenario: Successful login and tenant selection
    Then the home page should be displayed
