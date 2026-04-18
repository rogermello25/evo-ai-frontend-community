# Release Flow

Este repositorio agora e a fonte canonica do stack `evocrm`.

## Regras

- Todo codigo sai de `main`.
- Toda release deve nascer de um commit versionado por tag.
- Evite `latest` como referencia operacional humana; use tag semantica quando possivel.
- `latest` existe apenas como conveniencia tecnica.

## Imagens publicadas

- `ghcr.io/rogermello25/evocrm/evo-auth-fixed`
- `ghcr.io/rogermello25/evocrm/evo-crm-fixed`
- `ghcr.io/rogermello25/evocrm/evo-frontend-fixed`
- `ghcr.io/rogermello25/evocrm/evo-processor-fixed`
- `ghcr.io/rogermello25/evocrm/evo-core-fixed`
- `ghcr.io/rogermello25/evocrm/evo-gateway-fixed`
- `ghcr.io/rogermello25/evocrm/evo-bot-runtime-fixed`

## Fluxo recomendado

1. Commitar em `main`.
2. Criar tag de release, por exemplo:
   - `v2026.04.18`
3. Dar push da tag.
4. O workflow `Release` publica as imagens no GHCR.
5. Fazer deploy do servico necessario usando `scripts/deploy-swarm.sh`.

## Build manual na VPS

```bash
cd /root/evocrm
scripts/release-images.sh frontend v2026.04.18
scripts/release-images.sh gateway v2026.04.18
scripts/release-images.sh crm v2026.04.18
scripts/release-images.sh auth v2026.04.18
scripts/release-images.sh processor v2026.04.18
scripts/release-images.sh core v2026.04.18
scripts/release-images.sh bot-runtime v2026.04.18
```

## Deploy manual no Swarm

```bash
cd /root/evocrm
scripts/deploy-swarm.sh frontend v2026.04.18
scripts/deploy-swarm.sh gateway v2026.04.18
scripts/deploy-swarm.sh crm v2026.04.18
scripts/deploy-swarm.sh auth v2026.04.18
scripts/deploy-swarm.sh processor v2026.04.18
scripts/deploy-swarm.sh core v2026.04.18
scripts/deploy-swarm.sh bot-runtime v2026.04.18
```

## Politica operacional

- Nao fazer deploy paralelo de frontend e backend sem necessidade.
- Para hotfix:
  - backend primeiro
  - validacao
  - frontend depois
- Toda alteracao em producao deve voltar para este repo.
