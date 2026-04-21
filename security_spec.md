# Security Specification - Alupar Maintenance System

## Data Invariants
1. A **Checklist** must be associated with a valid team and have a server-side timestamp.
2. **Tasks** can only be created by Engineers/Managers. Grounding confirmations can only be performed by the assigned team.
3. **Safety Alerts** must have a reporter and a pending status upon creation.
4. **Profiles** are immutable except for the user's own data during setup.

## The "Dirty Dozen" Payloads (Attacker Strategy)

1. **Identity Spoofing**: Attempt to create a checklist with another team's ID.
2. **Role Escalation**: Anonymous user attempts to update their profile role to 'admin'.
3. **Ghost Field Injection**: Add `isApproved: true` to a checklist payload.
4. **ID Poisoning**: Use a 2MB string as a Checklist ID to cause resource exhaustion.
5. **Timestamp Manipulation**: Set `timestamp` in the past to bypass audit logs.
6. **Task Hijacking**: Team 1 attempts to confirm grounding for Team 2's equipment.
7. **Orphaned Writes**: Create a checklist for a Task ID that doesn't exist.
8. **Terminal State Bypass**: Attempt to update a 'completed' task back to 'scheduled'.
9. **PII Leak**: Authenticated user attempts to read all `profiles` (listing).
10. **Shadow Update**: Update a task including a field not whitelisted for teams.
11. **Denial of Wallet**: Infinite recursive queries or massive string injections.
12. **Verified Bypass**: Attempt to write data without `email_verified` (Note: Using Anonymous Login so this is adapted to Profile Verification).

## Test Runner Plan
- Verify that `allow list` on `checklists` rejects broad queries from teams.
- Verify that `allow update` on `tasks` rejects non-whitelisted keys.
- Verify that `allow create` on `profiles` rejects unauthorized roles.
