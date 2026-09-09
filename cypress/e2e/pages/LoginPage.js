const USERNAME_SELECTOR =
  '#username, input[name="username"], input[placeholder*="Username"], input[placeholder*="username"], input[type="email"], input[type="text"], input:not([type])';

class LoginPage {
  // ---------- Elements ----------
  getSsoButton() {
    return cy.contains('button', 'Sign in with SSO');
  }
  getUsernameInput() {
    return cy
      .get(USERNAME_SELECTOR)
      .filter(':visible')
      .first();
  }
  getPasswordInput() {
    return cy
      .get('#password, input[name="password"], input[type="password"]')
      .filter(':visible')
      .first();
  }
  getSignInButton() {
    return cy.contains('button', /^(Sign In|Login)$/i);
  }
  getTenantDropdown() {
    return cy.get('select, [role="combobox"]').first();
  }
  getContinueButton() {
    return cy.contains('button', 'Continue');
  }

  // ---------- Actions ----------
  visitLoginPage() {
    cy.visit('/PuffinUI/login/');
  }

  waitForLoginLayout() {
    cy.get('body', { timeout: 60000 }).should(($body) => {
      const hasSsoButton = $body
        .find('button')
        .toArray()
        .some((button) => button.textContent.trim() === 'Sign in with SSO');
      const hasUsernameInput = $body.find(USERNAME_SELECTOR).filter(':visible').length > 0;

      expect(
        hasSsoButton || hasUsernameInput,
        'SSO button or direct-login username input'
      ).to.equal(true);
    });
  }

  clickSsoButton() {
    this.getSsoButton().should('be.visible').click();
    this.waitForSsoLoginForm();
  }

  waitForSsoLoginForm() {
    // Wait for redirect to Aurora login page — assert on URL change
    // rather than the load event (more reliable for auth redirects)
    cy.url({ timeout: 30000 }).should('include', 'TestAuroraServer/Account/Login');

    // Wait for the form to be in the DOM before proceeding
    this.getUsernameInput().should('exist');
  }

  openKfhSsoLogin() {
    cy.visit('/AuroraAuth/api/auth/login');
    this.waitForSsoLoginForm();
  }

  verifyUsernamePasswordFormVisible() {
    cy.url().then((url) => {
      cy.get('body').then(($body) => {
        const inputCount = $body.find('input').length;
        const iframeCount = $body.find('iframe').length;
        const buttonLabels = $body
          .find('button')
          .toArray()
          .map((button) => button.textContent.trim())
          .filter(Boolean)
          .join(', ');

        if (inputCount === 0) {
          throw new Error(
            `Login form inputs were not found at ${url}. ` +
            `iframes=${iframeCount}; buttons=${buttonLabels || 'none'}; ` +
            `page=${$body.text().replace(/\s+/g, ' ').trim().slice(0, 300)}`
          );
        }
      });
    });

    this.getUsernameInput().should('be.visible');
    this.getPasswordInput().should('be.visible');
  }

  typeUsername(username) {
    this.getUsernameInput().should('be.visible').clear().type(username, { delay: 0 });
  }

  typePassword(password) {
    this.getPasswordInput().should('be.visible').clear().type(password, { delay: 0 });
  }

  clickSignIn() {
    cy.intercept('POST', '**/PuffinAPI/api/User/v1/login/aurora').as('auroraLogin');
    this.getSignInButton().should('be.visible').click();

    cy.wait('@auroraLogin', { timeout: 60000 }).then(({ response }) => {
      const statusCode = response?.statusCode;

      if (statusCode === 401) {
        throw new Error(
          'Aurora login API returned 401 (Unauthorized). Check USERNAME/PASSWORD in cypress.env.json or CI secrets.'
        );
      }

      expect(statusCode, 'Aurora login response status').to.not.equal(401);
    });

    // Wait until we leave the Aurora login page (redirect back to PuffinUI)
    cy.url({ timeout: 30000 }).should('not.include', 'TestAuroraServer/Account/Login');
  }

  clickDirectLogin() {
    cy.intercept('POST', '**/api/User/v1/login').as('directLogin');
    this.getSignInButton().should('be.visible').click();

    cy.wait('@directLogin', { timeout: 60000 }).then(({ response }) => {
      const statusCode = response?.statusCode;
      const responseBody = response?.body;
      const isSuccessful = responseBody?.isSuccess ?? responseBody?.success;

      if (!response || statusCode >= 400 || isSuccessful === false) {
        const message =
          responseBody?.responseMessage ||
          responseBody?.message ||
          'The login API rejected the request.';

        throw new Error(`Direct login failed (${statusCode || 'no status'}): ${message}`);
      }
    });

    cy.url({ timeout: 60000 }).should('not.include', '/PuffinUI/login');
  }

  selectTenant(tenantName) {
    cy.url({ timeout: 30000 }).then((currentUrl) => {
      if (!currentUrl.includes('/PuffinUI/select-tenant')) {
        return;
      }

      // Some environments pre-populate tenant in the URL and do not render a picker.
      cy.location('search').then((search) => {
        const params = new URLSearchParams(search);
        const selectedTenant = params.get('tenant_name');

        if (selectedTenant && selectedTenant.toLowerCase() === tenantName.toLowerCase()) {
          return;
        }

        cy.get('body').then(($body) => {
          const pickerSelector =
            'select, [role="combobox"], [data-testid*="tenant"], [data-testid*="Tenant"]';

          if ($body.find(pickerSelector).length > 0) {
            cy.get(pickerSelector).first().should('be.visible').click();
            cy.contains('li, option, [role="option"]', tenantName).click();
            return;
          }

          if ($body.text().includes(tenantName)) {
            cy.contains('button, a, li, div, span', tenantName).first().click({ force: true });
            return;
          }

          throw new Error(`Tenant selector was not found and tenant "${tenantName}" is not preselected in URL.`);
        });
      });
    });
  }

  clickContinue() {
    cy.url({ timeout: 30000 }).then((currentUrl) => {
      if (!currentUrl.includes('/PuffinUI/select-tenant')) {
        return;
      }

      cy.get('body').then(($body) => {
        const actionSelector = 'button, [role="button"], a, input[type="submit"]';
        const actionText = /continue|next|proceed|submit/i;

        const matchingActions = $body.find(actionSelector).filter((_, el) => {
          const label = ((el.innerText || el.value || '') + '').trim();
          return actionText.test(label);
        });

        if (matchingActions.length > 0) {
          cy.wrap(matchingActions[0]).should('be.visible').click({ force: true });
          return;
        }

        cy.location('search').then((search) => {
          const params = new URLSearchParams(search);
          const selectedTenant = params.get('tenant_name');

          if (selectedTenant) {
            cy.url({ timeout: 30000 }).should('not.include', '/PuffinUI/select-tenant');
            return;
          }

          throw new Error('Continue action was not found on the Select Tenant page.');
        });
      });
    });
  }

  verifyLoginSuccess() {
    cy.url({ timeout: 30000 }).then((url) => {
      if (url.includes('/PuffinUI/login')) {
        throw new Error(
          'User was redirected back to /PuffinUI/login after SSO flow. This usually means credentials are invalid or account is not authorized for the selected tenant.'
        );
      }
    });

    cy.url({ timeout: 30000 }).should('not.include', '/PuffinUI/login');
    cy.url().should('not.include', '/Account/Login');
    cy.url().should('not.include', '/select-tenant');
  }

  logout() {
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('button, a', 'Logout').click();
    cy.url().should('include', '/PuffinUI/login');
  }

  // ---------- Logout API ----------
  /**
   * Calls the logout API to clear any existing sessions on the server.
   * Also clears all cookies to ensure a clean slate for login.
   * This prevents "already logged in from another device" errors.
   */
  logoutViaApi() {
    // First clear all cookies
    cy.clearCookies();

    // Then call logout API
    cy.request({
      method: 'POST',
      url: '/PuffinAPI/api/User/v1/logout/',
      failOnStatusCode: false, // Don't fail if already logged out
    });

    // Clear cookies again after logout
    cy.clearCookies();
  }

  // ---------- Full Flow ----------
  login(username, password, tenantName) {
    // Clear any existing sessions first to avoid "already logged in from another device" errors
    this.logoutViaApi();

    // Now proceed with login
    this.visitLoginPage();
    this.waitForLoginLayout();

    cy.get('body').then(($body) => {
      const hasSsoButton = $body
        .find('button')
        .toArray()
        .some((button) => button.textContent.trim() === 'Sign in with SSO');

      if (hasSsoButton) {
        this.clickSsoButton();
        this.verifyUsernamePasswordFormVisible();
        this.typeUsername(username);
        this.typePassword(password);
        this.clickSignIn();
        return;
      }

      if (tenantName.toUpperCase() === 'KFH') {
        this.openKfhSsoLogin();
        this.verifyUsernamePasswordFormVisible();
        this.typeUsername(username);
        this.typePassword(password);
        this.clickSignIn();
        return;
      }

      this.verifyUsernamePasswordFormVisible();
      this.typeUsername(username);
      this.typePassword(password);
      this.clickDirectLogin();
    });

    this.selectTenant(tenantName);
    this.clickContinue();
    this.verifyLoginSuccess();
  }
}

export default new LoginPage();
