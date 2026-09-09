/**
 * campaign-debug.feature
 * Debug feature to inspect campaign page structure
 */

Feature: Campaign Page Debug
  @debug @skip
  Scenario: Inspect campaign page structure
    Given the user is logged in and on the home page
    When the user navigates to the SMS Broadcasts page
    Then the page should load successfully
