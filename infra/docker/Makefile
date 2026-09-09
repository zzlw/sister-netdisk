# 服务器运维入口。用法：make -C /opt/sister-netdisk <target>
DEPLOY_DIR ?= /opt/sister-netdisk
TAG ?= latest
SERVICE ?= all

COMPOSE_FILES := -f $(DEPLOY_DIR)/docker-compose.prod.yml
ifneq ($(wildcard $(DEPLOY_DIR)/docker-compose.acme.override.yml),)
COMPOSE_FILES += -f $(DEPLOY_DIR)/docker-compose.acme.override.yml
endif

PROD := docker compose $(COMPOSE_FILES) \
	--env-file $(DEPLOY_DIR)/.env.prod \
	--env-file $(DEPLOY_DIR)/.env.prod.local

.PHONY: prod-deploy prod-status prod-logs gateway-reload infra-up \
	cert-selfsigned acme-build cert-issue cert-renew

prod-deploy:
	cd $(DEPLOY_DIR) && ./deploy.sh $(SERVICE) $(TAG)

prod-status:
	$(PROD) ps

prod-logs:
	$(PROD) logs -f --tail=100

gateway-reload:
	$(PROD) exec gateway nginx -s reload

# 首次：cert-selfsigned → acme-build → infra-up → cert-issue → gateway-reload

cert-selfsigned:
	mkdir -p $(DEPLOY_DIR)/nginx/certs/live
	docker run --rm -v $(DEPLOY_DIR)/nginx/certs/live:/out alpine/openssl req -x509 -nodes \
		-newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -days 365 \
		-keyout /out/privkey.pem -out /out/fullchain.pem \
		-subj "/CN=self-signed-placeholder"

acme-build:
	docker compose -f $(DEPLOY_DIR)/docker-compose.prod.yml \
		--env-file $(DEPLOY_DIR)/.env.prod --env-file $(DEPLOY_DIR)/.env.prod.local \
		build acme

infra-up:
	$(PROD) up -d --no-deps postgres acme gateway

cert-issue:
	$(PROD) exec acme sh /scripts/issue.sh

cert-renew:
	$(PROD) exec acme acme.sh --renew-all --force
	$(PROD) exec gateway nginx -s reload
