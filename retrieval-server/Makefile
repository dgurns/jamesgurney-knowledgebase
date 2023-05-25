default: start

.PHONY: start
start:
	poetry run sh -c "source env.sh && poetry run start"

.PHONY: deploy
deploy:
	fly deploy