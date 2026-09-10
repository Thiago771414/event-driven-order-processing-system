# When to Use Netflix Conductor

Netflix Conductor is useful when a business flow needs to be coordinated, observed, and resumed as an explicit execution. It helps when workflow complexity already exists in the domain and needs to be manageable in operation.

## Use a Workflow Engine When

- the workflow has many steps;
- compensation logic is complex;
- attempts and timeouts need to be visible;
- operators need to inspect the workflow;
- multiple microservices participate;
- auditability matters.

Practical signs that Conductor can help:

- the team needs to know which step each checkout stopped at;
- there are many transitions between payment, inventory, orders, and notifications;
- failures require refunds, cancellation, reprocessing, or manual pauses;
- saga history needs to be accessible to support, operations, or auditing;
- retries that are only visible in logs are no longer sufficient.

## Avoid It When

- the project has only one or two simple services;
- Kafka choreography is sufficient;
- the operational complexity is not justified;
- the team does not need workflow visibility.

Also avoid it when the team lacks the operational maturity to maintain another infrastructure component. A workflow engine simplifies some complexities but adds others: operations, monitoring, workflow versioning, security, backups, and governance.

## Rule of Thumb for MiniShop

In the playbook's current state, Kafka, the outbox, Redis, PostgreSQL, workers, and observability already demonstrate event-driven reliability. Conductor would make sense in a future version where checkout has many business steps, recurring compensation, and a real need for operational inspection of each workflow.

For learning, keeping Conductor as documentation and a visual mock is an intentional choice: the idea remains clear without turning the project into an infrastructure-heavy environment.
