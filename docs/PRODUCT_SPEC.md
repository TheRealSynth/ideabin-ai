# Product Specification

## Definition
IdeaBin.ai is an AI operating system for turning raw ideas into structured concepts, validated opportunities, execution plans, projects, and measured outcomes.

## Primary job
Answer: **What should I work on next, why, what will it require, and what is the cheapest credible validation test?**

## V1 user
Optimize first for a single power user with many business/software/content/nonprofit/research ideas. Keep the data model multi-user capable without spending V1 effort on enterprise collaboration.

## Core objects
- Idea: raw input plus normalized concept.
- Evaluation: time-stamped scored snapshot.
- Relationship: typed edge such as overlaps, complements, depends_on, conflicts_with, can_merge_with, shares_capability, shares_distribution, shares_customer.
- Signal: external evidence affecting viability.
- Recommendation: BUILD, VALIDATE, RESEARCH, INCUBATE, ARCHIVE, KILL.
- Project: accepted idea converted to execution.
- Outcome: actual results compared with predictions.

## V1 acceptance gate
1. Capture 100 real ideas with low friction.
2. At least 90% structure without manual schema repair.
3. Related/duplicate suggestions are materially useful.
4. Ranking is explainable.
5. Selected idea converts to a project in one flow.
6. Predictions can be compared with actual outcomes.
7. Portfolio-level questions work without opening ideas one by one.

## Deferred
Enterprise permissions, marketplace/social network, autonomous company creation, task-manager replacement, true reinforcement learning, custom model training, complex graph database, dedicated vector database.