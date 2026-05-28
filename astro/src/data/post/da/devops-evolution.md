---
publishDate: 2025-12-13T00:00:00Z
title: DevOps Evolution
excerpt: 'Hvad er DevOps? Svaret flytter sig over tid, men der er ingen tvivl om at det favner bredt: kultur, delivery, infrastruktur, observability og nu AI.'
image: /assets/images/posts/evolution/devops-evolution.jpg
category: Essays
tags:
  - DevOps
  - Culture
  - CI/CD
  - DevX
author: Lars Kruse
---

_Hvad er DevOps?_ Det spørgsmål har vi diskuteret siden ideen tog form omkring 2008. Maaske er den bedste tilgang ikke at overdefinere begrebet, men i stedet at se paa, hvad det favner, og holde faellesskabet aabent for forandring.

Jeg skrev denne tekst for at hjælpe potentielle oplaegholdere med at vurdere, om et emne passer til en DevOps-konference. Den fungerer stadig til det formaal, men ogsaa som en guide for deltagere, der vil forstaa bredden i det, vi kalder DevOps.

## DevOps-tidslinjen

DevOps begyndte som hashtagget `#DevOps` omkring 2009 i Gent i forbindelse med en konference om agil infrastruktur. Aaret efter blev den tilbagevendende konference til DevOpsDays, og siden har bevægelsen udviklet sig i flere retninger.

I de tidlige aar blev DevOps ofte ligestillet med CI/CD. Jenkins, continuous integration og continuous delivery blev de dominerende referencepunkter, og fokus var i høj grad hurtigere automation og bedre flow til produktion.

## 2008 til 2015: branchingstrategier og automationspipelines

Bøger af Paul Duvall, Jez Humble og David Farley var med til at skabe et faelles sprog. Der kom aldrig et egentligt DevOps-manifest, men ideerne laenede sig tydeligt op ad agile principper: automatiser tidligt, reducer friktion, og hold hovedgrenen release-bar.

Jenkins blev standardsystemet for build i mange teams. Det var en periode, hvor build-automation i sig selv føltes som et gennembrud.

## 2015 til 2020: containere, infrastructure as code og observability

Docker og Kubernetes ændrede samtalen. Configuration as Code og Infrastructure as Code gjorde infrastruktur programmerbar, reproducerbar og reviewbar.

Samtidig modnedes observability. Prometheus, ELK-stakken og senere SRE-praksisser gav teams bedre indblik i komplekse systemer. Sikkerhed rykkede tættere paa leveranceflowet gennem DevSecOps, mens FinOps opstod som modvægt til ukontrollerede cloud-omkostninger.

Det var ogsaa her, at historien om DevOps som kultur blev svær at ignorere. Nedbrydning af siloer var lige saa vigtigt som værktøjerne.

```python
# Program to check if a number is prime or not

num = 29

# To take input from the user
#num = int(input("Enter a number: "))

# define a flag variable
flag = False

if num == 0 or num == 1:
    print(num, "is not a prime number")
elif num > 1:
    # check for factors
    for i in range(2, num):
        if (num % i) == 0:
            # if factor is found, set flag to True
            flag = True
            # break out of loop
            break

    # check if flag is True
    if flag:
        print(num, "is not a prime number")
    else:
        print(num, "is a prime number")

```

## 2020 til 2023: serverless, full-stack og DevX

Serverless-platforme og managed backends sænkede barren for at sende software i drift. GitHub Codespaces, devcontainers og remote-first arbejde flyttede DevOps-perspektivet fra rene infrastrukturteams til alle udvikleres daglige arbejdsgang.

Her begyndte Developer Experience, DevX, at fremstå som en naturlig videreførelse af DevOps. Udviklingsmiljøet blev en del af systemet, der skulle optimeres.

## 2024 og videre: AI træder ind

GitHub Copilot, prompt engineering og AI-assisteret udvikling har igen ændret hastigheden i softwareproduktion. Det skaber tydelige kvalitetsrisici, men forstærker ogsaa centrale DevOps-værdier: hurtige feedback-loops, delt ansvar og kontinuerlig læring.

Det afgørende spørgsmål er ikke, om AI er godt eller daarligt i sig selv. Det er, hvordan vi bevarer maintainability, security og reliability, mens værktøjerne udvikler sig hurtigt.

## Contemporary DevOps buzzwords

DevOps vokser fortsat, og ordlisten vokser med:

- Automation / Autonomation
- Configuration as Code
- Containerization
- Continuous Delivery
- DevContainers
- DevSecOps
- DORA Metrics
- GitOps
- Infrastructure as Code
- Observability
- Platform Engineering
- Serverless / FaaS
- Site Reliability Engineering (SRE)
- Terraform
- You Build It, You Run It

DevOps er ikke død. Det er blevet bredere end de værktøjer, der gjorde det populært i starten, og det optager løbende nye praksisser i takt med at softwarelandskabet ændrer sig.
