# Requirements Document

## Introduction

The Defensive Immunity System (Sistema de Imunidade de Defesa) is a feature for the Midnight Club ranking system that rewards pilots who successfully defend their positions multiple times consecutively. When a pilot wins 2 consecutive defenses, they earn temporary immunity from being challenged, allowing them to focus on offensive strategies without constant defensive pressure.

This system introduces strategic depth by:
- Rewarding consistent defensive performance
- Creating breathing room for pilots under heavy attack pressure
- Maintaining offensive freedom during immunity periods
- Differentiating immunity duration based on position context (Gatekeeper vs. regular pilots)

## Glossary

- **Defensive_Immunity_System**: The feature that tracks consecutive defense wins and grants temporary immunity from challenges
- **Pilot**: A player in the Midnight Club ranking system
- **Lista_1**: The top-tier ranking list containing 5 pilots
- **Lista_2**: The second-tier ranking list containing 10 pilots
- **Gatekeeper**: The pilot occupying the last position (8º) in Lista_2
- **Consecutive_Defense**: A defense challenge won by the defending pilot without interruption by losses or position changes
- **Defense_Challenge**: A challenge where the pilot is the defender (being challenged by someone below)
- **Attack_Challenge**: A challenge where the pilot is the attacker (challenging someone above)
- **Desafio_Vaga**: A special challenge type where external pilots (Street Runners) challenge the Gatekeeper for a spot in Lista_2
- **Immunity_Period**: The time duration during which a pilot cannot be challenged
- **Defense_Counter**: The tracked number of consecutive successful defenses (consecutive_defenses field)
- **Attack_Cooldown**: The standard 3-day cooldown applied to pilots who initiate challenges
- **Defense_Cooldown**: The standard 1-day cooldown applied to pilots who lose defensive challenges
- **Database**: The Supabase PostgreSQL database storing player state
- **Player_Interface**: The TypeScript interface defining player properties in the frontend

## Requirements

### Requirement 1: Track Consecutive Defense Wins

**User Story:** As a pilot, I want the system to track my consecutive defense victories, so that I can earn immunity rewards for consistent defensive performance.

#### Acceptance Criteria

1. WHEN a pilot wins a defense challenge, THE Defensive_Immunity_System SHALL increment the Defense_Counter by 1
2. WHEN a pilot loses a defense challenge, THE Defensive_Immunity_System SHALL reset the Defense_Counter to 0
3. WHEN a pilot wins an attack challenge and changes position, THE Defensive_Immunity_System SHALL reset the Defense_Counter to 0
4. WHEN a pilot loses an attack challenge, THE Defensive_Immunity_System SHALL preserve the current Defense_Counter value
5. THE Database SHALL store the Defense_Counter value in the consecutive_defenses column as an INTEGER with DEFAULT 0
6. THE Player_Interface SHALL include a consecutiveDefenses property of type number

### Requirement 2: Grant Gatekeeper Immunity

**User Story:** As the Gatekeeper (last pilot in Lista_2), I want to earn 3 days of immunity after winning 2 consecutive Desafio_Vaga defenses, so that I can have breathing room from constant external challenges.

#### Acceptance Criteria

1. WHEN the Gatekeeper wins a defense challenge AND the Defense_Counter equals 2 AND the challenge type is Desafio_Vaga, THE Defensive_Immunity_System SHALL set the Immunity_Period to 3 days from the current timestamp
2. WHILE the Immunity_Period is active, THE Defensive_Immunity_System SHALL block all incoming Desafio_Vaga challenges to the Gatekeeper
3. WHILE the Immunity_Period is active, THE Gatekeeper SHALL be able to initiate attack challenges normally
4. WHEN the Immunity_Period expires, THE Defensive_Immunity_System SHALL allow the Gatekeeper to receive Desafio_Vaga challenges again
5. THE Database SHALL store the Immunity_Period end timestamp in the cooldown_immunity_until column as TIMESTAMPTZ NULLABLE

### Requirement 3: Grant Regular Pilot Immunity

**User Story:** As a regular pilot (not the Gatekeeper), I want to earn 7 days of immunity after winning 2 consecutive defenses, so that I can focus on climbing the rankings without constant defensive pressure.

#### Acceptance Criteria

1. WHEN a pilot wins a defense challenge AND the Defense_Counter equals 2 AND the pilot is not the Gatekeeper, THE Defensive_Immunity_System SHALL set the Immunity_Period to 7 days from the current timestamp
2. WHILE the Immunity_Period is active, THE Defensive_Immunity_System SHALL block all incoming challenges to the pilot
3. WHILE the Immunity_Period is active, THE pilot SHALL be able to initiate attack challenges normally
4. WHEN the Immunity_Period expires, THE Defensive_Immunity_System SHALL allow the pilot to receive challenges again
5. THE Player_Interface SHALL include a cooldownImmunityUntil property of type number or null

### Requirement 4: Validate Challenge Eligibility

**User Story:** As a pilot attempting to challenge another pilot, I want the system to check if my target has active immunity, so that I don't waste time on invalid challenges.

#### Acceptance Criteria

1. WHEN a pilot attempts to initiate a challenge, THE Defensive_Immunity_System SHALL check if the target pilot has an active Immunity_Period
2. IF the target pilot has an active Immunity_Period, THEN THE Defensive_Immunity_System SHALL block the challenge and return an error message
3. THE error message SHALL include the remaining time until immunity expires in days
4. THE Defensive_Immunity_System SHALL apply this validation to tryChallenge function
5. THE Defensive_Immunity_System SHALL apply this validation to tryCrossListChallenge function
6. THE Defensive_Immunity_System SHALL apply this validation to tryStreetRunnerChallenge function
7. THE Defensive_Immunity_System SHALL apply this validation to tryDesafioVaga function

### Requirement 5: Preserve Immunity During Offensive Actions

**User Story:** As a pilot with active immunity, I want to be able to attack other pilots without losing my defensive immunity, so that I can maintain strategic flexibility.

#### Acceptance Criteria

1. WHEN a pilot with active Immunity_Period initiates an attack challenge, THE Defensive_Immunity_System SHALL allow the attack to proceed
2. WHEN the attack challenge completes, THE Defensive_Immunity_System SHALL apply the standard Attack_Cooldown of 3 days
3. WHEN the attack challenge completes, THE Defensive_Immunity_System SHALL preserve the existing Immunity_Period end timestamp
4. IF the pilot wins the attack and changes position, THEN THE Defensive_Immunity_System SHALL reset the Defense_Counter to 0
5. IF the pilot wins the attack and changes position, THEN THE Defensive_Immunity_System SHALL maintain the Immunity_Period until its original expiration time

### Requirement 6: Display Immunity Status

**User Story:** As a user viewing the ranking lists, I want to see which pilots have active immunity, so that I can make informed decisions about who to challenge.

#### Acceptance Criteria

1. WHEN a pilot has an active Immunity_Period, THE user interface SHALL display a shield badge or icon next to the pilot name
2. THE user interface SHALL display the Defense_Counter value on the pilot profile
3. WHEN a user hovers over the immunity shield icon, THE user interface SHALL display a tooltip showing the remaining immunity time
4. WHEN a pilot attempts to challenge an immune pilot, THE user interface SHALL display the error message "Este piloto está protegido por imunidade de defesa. Tempo restante: X dias."
5. IF the immune pilot is the Gatekeeper, THEN THE error message SHALL be "Imunidade Gatekeeper ativa: Este piloto defendeu sua posição 2 vezes seguidas."
6. IF the immune pilot is not the Gatekeeper, THEN THE error message SHALL be "Imunidade de Defesa ativa: Este piloto defendeu sua posição 2 vezes seguidas."

### Requirement 7: Synchronize State with Database

**User Story:** As a system administrator, I want all immunity state to be persisted in the database, so that the system remains consistent across sessions and server restarts.

#### Acceptance Criteria

1. WHEN the Defense_Counter changes, THE Defensive_Immunity_System SHALL update the consecutive_defenses column in the Database
2. WHEN the Immunity_Period is granted, THE Defensive_Immunity_System SHALL update the cooldown_immunity_until column in the Database
3. WHEN the Immunity_Period expires, THE Defensive_Immunity_System SHALL set the cooldown_immunity_until column to NULL
4. WHEN loading player state from the Database, THE Defensive_Immunity_System SHALL convert the cooldown_immunity_until TIMESTAMPTZ to a number timestamp in milliseconds
5. THE challengeSync module SHALL include immunity state updates in all challenge result synchronization operations

### Requirement 8: Handle Edge Cases

**User Story:** As a system designer, I want the immunity system to handle edge cases correctly, so that the feature behaves predictably in all scenarios.

#### Acceptance Criteria

1. WHEN a pilot with active Immunity_Period is manually removed from the ranking, THE Defensive_Immunity_System SHALL clear the immunity state
2. WHEN a pilot with active Immunity_Period completes initiation and joins a list, THE Defensive_Immunity_System SHALL preserve the immunity state
3. IF a pilot has both Attack_Cooldown and Immunity_Period active simultaneously, THEN THE Defensive_Immunity_System SHALL enforce both restrictions independently
4. WHEN the system time is equal to or greater than the Immunity_Period end timestamp, THE Defensive_Immunity_System SHALL treat the immunity as expired
5. WHEN calculating immunity duration, THE Defensive_Immunity_System SHALL use milliseconds since Unix epoch for all timestamp calculations

## Test Scenarios

### Critical Test Cases

1. **Pilot wins 2 consecutive defenses → gains immunity**
   - Setup: Pilot at position 3 in Lista_1 with Defense_Counter = 1
   - Action: Pilot wins defense challenge
   - Expected: Defense_Counter = 2, cooldown_immunity_until = now + 7 days

2. **Pilot with immunity attempts to be challenged → blocked**
   - Setup: Pilot has cooldown_immunity_until = now + 5 days
   - Action: Another pilot attempts to challenge
   - Expected: Challenge blocked, error message displayed with "5 dias" remaining

3. **Pilot with immunity attacks → allowed, maintains immunity**
   - Setup: Pilot has cooldown_immunity_until = now + 5 days, Defense_Counter = 2
   - Action: Pilot initiates attack challenge
   - Expected: Challenge allowed, Attack_Cooldown applied, cooldown_immunity_until unchanged

4. **Pilot with immunity wins attack → loses defense counter**
   - Setup: Pilot has cooldown_immunity_until = now + 5 days, Defense_Counter = 2
   - Action: Pilot wins attack and swaps positions
   - Expected: Defense_Counter = 0, cooldown_immunity_until unchanged

5. **Gatekeeper wins 2 consecutive Desafio_Vaga defenses → 3 days immunity**
   - Setup: Pilot at last position in Lista_2, Defense_Counter = 1, challenge type = Desafio_Vaga
   - Action: Pilot wins defense
   - Expected: Defense_Counter = 2, cooldown_immunity_until = now + 3 days

6. **Regular pilot wins 2 consecutive defenses → 7 days immunity**
   - Setup: Pilot at position 5 in Lista_2, Defense_Counter = 1, challenge type = ladder
   - Action: Pilot wins defense
   - Expected: Defense_Counter = 2, cooldown_immunity_until = now + 7 days

7. **Immunity expires → pilot can be challenged again**
   - Setup: Pilot has cooldown_immunity_until = now - 1 hour
   - Action: Another pilot attempts to challenge
   - Expected: Challenge allowed, no immunity error

## Affected Files

- `supabase/bootstrap_database.sql` - Add consecutive_defenses and cooldown_immunity_until columns
- `src/types/championship.ts` - Update Player interface with new properties
- `src/hooks/useChampionship.ts` - Implement validation and processing logic
- `src/components/PlayerList.tsx` - Add visual immunity indicators
- `src/lib/challengeSync.ts` - Synchronize immunity state with database

## Implementation Notes

### Database Schema Changes

```sql
ALTER TABLE public.players 
ADD COLUMN consecutive_defenses INTEGER DEFAULT 0,
ADD COLUMN cooldown_immunity_until TIMESTAMPTZ;
```

### TypeScript Interface Changes

```typescript
export interface Player {
  // ... existing properties
  consecutiveDefenses: number;
  cooldownImmunityUntil: number | null;
}
```

### Business Logic Constants

```typescript
const IMMUNITY_GATEKEEPER_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const IMMUNITY_REGULAR_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
```
