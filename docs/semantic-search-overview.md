# Busca Semântica e Híbrida no Angular (beta)

## Visão geral

O portal Angular passa a oferecer três modos de busca: **Léxica**, **Semântica** e **Híbrida**. Os dois últimos usam a infraestrutura beta de embeddings no Solr 10.1 do backend:

- a busca semântica encontra itens por proximidade de significado;
- a busca híbrida combina palavras-chave e similaridade semântica com RRF (*Reciprocal Rank Fusion*).

## Interface e requisições

O formulário de busca apresenta as opções Semântica e Híbrida somente quando o backend expõe, respectivamente, `semantic.search.enabled=true` e `hybrid.search.enabled=true`.

Ao pesquisar, o Angular envia `searchType=lexical|semantic|hybrid` para o Discovery. O parâmetro faz parte da URL e da chave de cache, garantindo que uma mesma consulta não reutilize resultados entre modos diferentes.

A página de resultados identifica o modo ativo e exibe o `score` de relevância fornecido pelo backend. As traduções das novas opções estão disponíveis em inglês, espanhol e português do Brasil.

## Dependência do backend

O Angular não gera embeddings. O backend indexa título, resumo e demais metadados configurados como vetores; em textos longos, o resumo é dividido em segmentos (*chunks*) com o título como contexto. O Solr 10.1 beta consulta esses vetores em modo único ou multivetores e, no modo híbrido, une o ranking vetorial e o léxico por RRF.

Não foram criadas variáveis de ambiente específicas no Angular. A ativação e a configuração do serviço de embeddings ocorrem no backend.

## Files Changed in Branch

1. `src/app/core/data/search-response-parsing.service.ts`
2. `src/app/core/shared/search/models/paginated-search-options.model.ts`
3. `src/app/core/shared/search/models/search-options.model.ts`
4. `src/app/core/shared/search/models/search-result.model.ts`
5. `src/app/home-page/home-page.component.html`
6. `src/app/home-page/home-page.component.ts`
7. `src/app/search-page/configuration-search-page.component.ts`
8. `src/app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component.html`
9. `src/app/shared/search-form/search-form.component.html`
10. `src/app/shared/search-form/search-form.component.scss`
11. `src/app/shared/search-form/search-form.component.ts`
12. `src/app/shared/search-form/themed-search-form.component.ts`
13. `src/app/shared/search/search-configuration.service.ts`
14. `src/app/shared/search/search-results/search-results.component.html`
15. `src/app/shared/search/search-results/search-results.component.scss`
16. `src/app/shared/search/search.component.html`
17. `src/app/shared/search/search.component.ts`
18. `src/app/shared/search/search.service.spec.ts`
19. `src/app/shared/search/search.service.ts`
20. `src/assets/i18n/en.json5`
21. `src/assets/i18n/es.json5`
22. `src/assets/i18n/pt-BR.json5`
