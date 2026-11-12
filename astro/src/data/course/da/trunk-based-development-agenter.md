---
title: Trunk-based development med collaborative agents
excerpt: Afprøv trunk-based development med små leverancer, hurtig feedback og rammer, der gør samarbejde mellem mennesker og AI-agenter trygt.
icon: tabler:git-branch
translationSlug: trunk-based-development-with-collaborative-agents
audience: Udviklingsteams og tekniske ledere, der vil forbedre flow, feedback og samarbejde.
duration: Tilpasses mål og format.
format: Hands-on workshop efter aftale.
order: 4
metadata:
  title: Trunk-based development med collaborative agents | Workshop
  description: En praktisk workshop om korte grene, leveringsklar main, automatiske kvalitetstjek og ansvarligt samarbejde med AI-agenter.
---

I denne hands-on workshop arbejder deltagerne med trunk-based development som en samlet arbejdsform: små ændringer integreres ofte, feedback kommer hurtigt, og main holdes i en tilstand, hvor ændringer kan leveres. Vi undersøger også, hvordan AI-agenter kan indgå i arbejdet uden at gøre kvalitet eller ansvar uklart.

## Trunk-based praksis

- Små opgaver med korte, kortlivede branches og hyppig integration til trunk.
- En ren, lineær og altid leveringsklar main, hvor hver leverance er atomisk og kan spores tilbage til en konkret opgave.
- Automatiske checks, tests og builds som løbende feedback, så kvalitet sikres tæt på arbejdet frem for at blive udskudt til en sen kontrolport.
- Test af observerbar adfærd frem for implementationens indre detaljer, så løsningen fortsat kan ændres og refaktoreres.
- Issue-forankret arbejdshistorik, hvor beslutninger, afklaringer og status samles med opgaven.

## Samarbejde med agenter

- Afgræns opgaven med en tydelig specifikation, acceptkriterier og adgang til relevante repo-instruktioner.
- Gør repository-miljøet sikkert og forudsigeligt med containere, stabile testdata samt checks, der også kan køres lokalt.
- Lad agenten arbejde på en kortlivet branch; agenten leverer et forslag, mens mennesker bevarer ansvar for beslutninger, review og integration til main.
- Brug test- og checkresultater som konkret feedback til både agenten og teamet. Når samarbejdet støder på uklarheder, forbedres specifikationer, instruktioner eller værn i repoet.
- Vurder pull requests ud fra jeres arbejdsgang: unødvendige overleveringer og manuelle godkendelsesporte kan skabe ventetid, mens fokuseret review og ansvar stadig er vigtige dele af samarbejdet.

## Udbytte

Teamet afprøver en non-blocking udviklingsproces på en konkret opgave og identificerer, hvilke ændringer i specifikationer, repository, tests og arbejdsgange der skal til for at integrere ofte uden at gå på kompromis med kvalitet eller ansvar.

## Videre læsning

- [Collaborative Agents](https://www.lakruzz.com/stories/collaborative-agents/) – om repository-design, in-situ checks og trygge rammer for agent-samarbejde.
- [GitHub’s Enfant Terrible: Pull Requests](https://www.lakruzz.com/stories/githubs-enfant-terrible/) – om issue-forankret arbejde, atomiske leverancer, lineær historik og mulige omkostninger ved ventetid i reviewflowet.
