SHELL := /bin/bash

.PHONY: help bootstrap dev lint test doctor db-reset load-test agent-shell

help:
	@echo "klabo.world (Next.js) – canonical commands"
	@echo "Use 'just' targets directly whenever possible."
	@echo "Targets: bootstrap, dev, lint, test, doctor, db-reset, load-test, agent-shell"

bootstrap:
	just bootstrap

dev:
	just dev

lint:
	just lint

test:
	just test

doctor:
	just doctor

db-reset:
	just db-reset

load-test:
	just load-test

agent-shell:
	just agent-shell
