# Migração de dados (legado Django → API FastAPI + Cognito)

Este repositório é **somente a API FastAPI**. Se existir histórico em um monólito Django antigo, o alinhamento de identidade e dados segue estas opções.

## Problema central

- No Django, usuários costumam ser `auth.User` (ID inteiro).
- Na API, o usuário canônico é `api_users.id` = **string** `sub` do AWS Cognito.

## Opções de banco

- **Banco novo só para a API:** isolamento total; exige ETL na troca.
- **Mesmo cluster PostgreSQL, database dedicado** (ex.: produção AWS RDS com database `ginga`): recomendado para custo e isolamento lógico.
- **Período híbrido:** definir fonte da verdade por domínio até o cutover.

## Mapeamento legado → Cognito

1. Criar usuários no Cognito para cada usuário ativo do legado.
2. Persistir o `sub` em `api_users` (e opcionalmente `legacy_user_id` para rastreio).
3. Copiar perfis, empresas, vagas, candidaturas etc. para as tabelas `api_*`, ajustando FKs para o novo `sub`.
4. Validar contagens antes do desligamento do Django.

## Ferramentas

ETL em script ou job pontual; evite `AUTO_RUN_MIGRATIONS=true` em produção sem processo de release alinhado.
