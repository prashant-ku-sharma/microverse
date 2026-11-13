# ADR 0010: Observe remote operations and recover with safe lifetimes

- Status: accepted
- Date: 2026-11-13

## Context

Independent remote failures must leave the Host and other organisms usable. Module load success does not establish service health. Federation and native ESM imports can cache failures, while SYMBIONT and MUTANT run persistent background owners.

## Decision

Keep the IMMUNE SYSTEM in ECOSYSTEM. Observe validated module loads, committed views and service startup independently. Use attempt tokens, bounded load timeouts and failure-prioritized aggregation. Keep bounded, validated diagnostic metadata locally; never promote persisted history to current availability.

Use per-route React boundaries and view remount retries for render errors. Use fresh-page retries for failed imports, timeouts and release mismatches. Do not force-replace live containers or service owners. Continue enforcing NUCLEUS trust/compatibility policy and validated fallback.

## Consequences

Other organisms continue functioning during an individual failure. Timed-out imports can finish internally but cannot change the recorded outcome. A fresh-page retry may lose unsaved edits; durable owner state reconciles normally. Monitoring states are honest observations rather than an uptime service. CSP guidance supplements origin allowlisting; neither federation nor error boundaries provide a security sandbox. See [resilience](../resilience.md) for limitations and reproduction.
