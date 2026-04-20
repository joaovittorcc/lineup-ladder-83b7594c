# Implementation Plan: Defensive Immunity System

## Overview

This implementation plan breaks down the Defensive Immunity System into discrete coding tasks. The system tracks consecutive defense wins and grants temporary immunity from challenges after 2 successful defenses. Implementation follows this sequence: database migration → TypeScript interfaces → validation logic → result processing → UI components → property-based tests.

## Tasks

- [ ] 1. Database schema migration
  - Add consecutive_defenses and cooldown_immunity_until columns to players table
  - Create performance indexes for immunity queries
  - Add column comments for documentation
  - Verify migration with test queries
  - _Requirements: 1.5, 2.5, 7.1, 7.2_

- [ ] 2. Update TypeScript interfaces and data conversion
  - [ ] 2.1 Update Player interface in src/types/championship.ts
    - Add consecutiveDefenses: number property
    - Add cooldownImmunityUntil: number | null property
    - _Requirements: 1.6, 3.5_
  
  - [ ] 2.2 Update dbPlayerToLocal conversion function in src/hooks/useChampionship.ts
    - Convert consecutive_defenses from database to consecutiveDefenses
    - Convert cooldown_immunity_until TIMESTAMPTZ to millisecond timestamp
    - Handle null values correctly
    - _Requirements: 7.4_
  
  - [ ]* 2.3 Write property test for timestamp conversion
    - **Property 11: Timestamp Conversion Round-Trip**
    - **Validates: Requirements 7.4**

- [ ] 3. Implement business logic constants
  - Define IMMUNITY_GATEKEEPER_MS = 3 days in milliseconds
  - Define IMMUNITY_REGULAR_MS = 7 days in milliseconds
  - Add constants to src/hooks/useChampionship.ts
  - _Requirements: 2.1, 3.1_

- [ ] 4. Implement immunity validation logic
  - [ ] 4.1 Create validateChallengeEligibility helper function
    - Check if target has active immunity (cooldownImmunityUntil > now)
    - Calculate remaining days for error messages
    - Return formatted error message or null
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 4.2 Integrate validation into challenge functions
    - Add immunity check to tryChallenge function
    - Add immunity check to tryCrossListChallenge function
    - Add immunity check to tryStreetRunnerChallenge function
    - Add immunity check to tryDesafioVaga function
    - _Requirements: 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 4.3 Write property test for immunity enforcement
    - **Property 2: Immunity Enforcement**
    - **Validates: Requirements 2.2, 2.4, 3.2, 3.4, 4.1, 4.2**
  
  - [ ]* 4.4 Write unit tests for error message formatting
    - Test Gatekeeper immunity error message
    - Test regular pilot immunity error message
    - Test remaining days calculation
    - _Requirements: 4.3, 6.5, 6.6_

- [ ] 5. Checkpoint - Ensure validation logic works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement result processing logic
  - [ ] 6.1 Create processChallengeResult helper function
    - Determine if challenge was defense or attack for each player
    - Calculate position swap based on winner
    - Return update objects for both players
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 6.2 Implement defense counter update logic
    - Increment consecutiveDefenses on defense win
    - Reset consecutiveDefenses to 0 on defense loss
    - Reset consecutiveDefenses to 0 on attack win with position change
    - Preserve consecutiveDefenses on attack loss
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 6.3 Write property test for defense counter transitions
    - **Property 1: Defense Counter State Transitions**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  
  - [ ]* 6.4 Write property test for defense counter reset on position change
    - **Property 6: Defense Counter Reset on Position Change**
    - **Validates: Requirements 5.4**

- [ ] 7. Implement immunity grant logic
  - [ ] 7.1 Create isPlayerGatekeeper helper function
    - Check if player is in list-02
    - Check if player is at last position (8º)
    - Return boolean
    - _Requirements: 2.1_
  
  - [ ] 7.2 Implement Gatekeeper immunity grant
    - Check if consecutiveDefenses == 2
    - Check if player is Gatekeeper
    - Check if challenge type is desafio-vaga
    - Set cooldownImmunityUntil = now + 3 days
    - _Requirements: 2.1_
  
  - [ ] 7.3 Implement regular pilot immunity grant
    - Check if consecutiveDefenses == 2
    - Check if player is NOT Gatekeeper
    - Set cooldownImmunityUntil = now + 7 days
    - _Requirements: 3.1_
  
  - [ ]* 7.4 Write property test for Gatekeeper immunity grant
    - **Property 7: Gatekeeper Immunity Grant**
    - **Validates: Requirements 2.1**
  
  - [ ]* 7.5 Write property test for regular pilot immunity grant
    - **Property 8: Regular Pilot Immunity Grant**
    - **Validates: Requirements 3.1**

- [ ] 8. Implement attack cooldown and immunity preservation
  - [ ] 8.1 Apply 3-day attack cooldown to attacker
    - Set challengeCooldownUntil = now + 3 days for challenger
    - Apply regardless of win/loss
    - _Requirements: 5.2_
  
  - [ ] 8.2 Preserve immunity during attacks
    - Do NOT modify cooldownImmunityUntil when pilot attacks
    - Preserve immunity on attack win with position change
    - Preserve immunity on attack loss
    - _Requirements: 5.3, 5.5_
  
  - [ ]* 8.3 Write property test for attack cooldown application
    - **Property 4: Attack Cooldown Application**
    - **Validates: Requirements 5.2**
  
  - [ ]* 8.4 Write property test for immunity preservation during attacks
    - **Property 5: Immunity Preservation During Attacks**
    - **Validates: Requirements 5.3, 5.5**

- [ ] 9. Integrate result processing into addPoint function
  - [ ] 9.1 Call processChallengeResult when challenge completes
    - Pass challenge, winner, and lists to processChallengeResult
    - Apply returned updates to both players
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 9.2 Clear immunity on defense loss
    - Set cooldownImmunityUntil = null when defender loses
    - Reset consecutiveDefenses to 0
    - _Requirements: 1.2_
  
  - [ ]* 9.3 Write property test for offensive freedom during immunity
    - **Property 3: Offensive Freedom During Immunity**
    - **Validates: Requirements 2.3, 3.3, 5.1**

- [ ] 10. Checkpoint - Ensure result processing works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Update challengeSync module
  - [ ] 11.1 Add immunity fields to sync operations
    - Include consecutive_defenses in player updates
    - Include cooldown_immunity_until in player updates
    - Convert millisecond timestamps to TIMESTAMPTZ for database
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [ ] 11.2 Handle null immunity values
    - Set cooldown_immunity_until to NULL when immunity expires
    - Handle null values in database queries
    - _Requirements: 7.3_
  
  - [ ]* 11.3 Write property test for database state synchronization
    - **Property 10: Database State Synchronization**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 12. Implement UI components
  - [ ] 12.1 Create ImmunityBadge component
    - Display shield icon when pilot has active immunity
    - Calculate remaining days/hours
    - Show tooltip with remaining time
    - _Requirements: 6.1, 6.3_
  
  - [ ] 12.2 Create DefenseCounter component
    - Display trophy icon with consecutiveDefenses count
    - Only show when consecutiveDefenses > 0
    - _Requirements: 6.2_
  
  - [ ] 12.3 Update PlayerList.tsx to show immunity status
    - Add ImmunityBadge to player cards
    - Add DefenseCounter to player cards
    - _Requirements: 6.1, 6.2_
  
  - [ ] 12.4 Implement challenge error toast
    - Display error message when challenge blocked by immunity
    - Show Gatekeeper-specific message when applicable
    - Show regular pilot message when applicable
    - _Requirements: 6.4, 6.5, 6.6_

- [ ] 13. Handle edge cases
  - [ ] 13.1 Implement independent cooldown enforcement
    - Check both challengeCooldownUntil and cooldownImmunityUntil
    - Block attacks if challengeCooldownUntil > now
    - Block incoming challenges if cooldownImmunityUntil > now
    - _Requirements: 8.3_
  
  - [ ] 13.2 Handle immunity expiration
    - Treat immunity as expired when now >= cooldownImmunityUntil
    - Allow challenges when immunity expired
    - _Requirements: 8.4_
  
  - [ ] 13.3 Handle timestamp edge cases
    - Use milliseconds since Unix epoch for all calculations
    - Handle null timestamps correctly
    - _Requirements: 8.5_
  
  - [ ]* 13.4 Write property test for independent cooldown enforcement
    - **Property 12: Independent Cooldown Enforcement**
    - **Validates: Requirements 8.3**
  
  - [ ]* 13.5 Write property test for error message formatting
    - **Property 9: Error Message Formatting**
    - **Validates: Requirements 4.3**

- [ ] 14. Final checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Verify complete feature integration
  - [ ] 15.1 Test full immunity lifecycle
    - Pilot wins 2 consecutive defenses → gains immunity
    - Pilot with immunity cannot be challenged
    - Pilot with immunity can attack others
    - Immunity expires after duration
  
  - [ ] 15.2 Test Gatekeeper-specific behavior
    - Gatekeeper wins 2 Desafio_Vaga defenses → 3 days immunity
    - Gatekeeper immunity blocks Desafio_Vaga challenges
  
  - [ ] 15.3 Test regular pilot behavior
    - Regular pilot wins 2 defenses → 7 days immunity
    - Regular pilot immunity blocks all incoming challenges
  
  - [ ] 15.4 Test database persistence
    - Immunity state survives page refresh
    - Defense counter persists across sessions
    - _Requirements: 7.1, 7.2, 7.3_

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- All property tests should use fast-check or similar PBT library for TypeScript
- Database migration should be run during low-traffic period
- UI components use existing shadcn/ui components (Badge, Tooltip, Toast)
