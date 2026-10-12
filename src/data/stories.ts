import type { Story } from '../domain/types';

// User-supplied prototype fixtures; neither headlines nor totals are live.
export const stories: Story[] = [
  {
    "id": "sample-1",
    "topic": "Elections",
    "publishedAt": "2026-10-04T00:07:12Z",
    "headline": "Brazil votes in a Lula–Bolsonaro rematch",
    "summary": "Brazil goes to the polls on Sunday, four years after President Lula narrowly beat Jair Bolsonaro. This time Lula’s opponent is Bolsonaro’s son, Flávio. The latest polls suggest Lula’s lead is shrinking and that neither candidate is likely to win outright in this round.",
    "sources": [
      {
        "name": "NPR",
        "url": "https://www.npr.org/2026/10/02/nx-s1-5989727/brazil-election-lula-bolsonaro-flavio-democracy"
      },
      {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/news/2026/10/4/brazils-lula-and-bolsonaro-close-campaigns-ahead-of-critical-election"
      }
    ],
    "totals": {
      "good": 1204,
      "bad": 1310,
      "skip": 702
    }
  },
  {
    "id": "sample-2",
    "topic": "Culture",
    "publishedAt": "2026-10-03T11:00:00Z",
    "headline": "Philadelphia natural history museum closes just short of 200 years",
    "summary": "Philadelphia’s Academy of Natural Sciences, a natural history museum best known for its dinosaurs, shut down this week. It was close to its 200th anniversary. The closure went ahead despite a hard-fought campaign by residents, local politicians and scientists to keep it open.",
    "sources": [
      {
        "name": "NPR",
        "url": "https://www.npr.org/2026/10/03/nx-s1-5989716/philadelphia-academy-natural-sciences-museum-closure"
      }
    ],
    "totals": {
      "good": 212,
      "bad": 2105,
      "skip": 340
    }
  },
  {
    "id": "sample-3",
    "topic": "Conflict",
    "publishedAt": "2026-10-04T01:41:28Z",
    "headline": "Ethiopian government says it has taken Tigray’s capital",
    "summary": "Ethiopia’s government forces say they have captured Mekelle, the capital of the Tigray region, from Tigray fighters. The announcement follows a week of heavy fighting.",
    "sources": [
      {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/video/newsfeed/2026/10/4/ethiopian-government-troops-seize-tigrays-capital-mekelle"
      }
    ],
    "totals": {
      "good": 402,
      "bad": 1188,
      "skip": 1320
    }
  },
  {
    "id": "sample-4",
    "topic": "Courts",
    "publishedAt": "2026-10-03T09:00:00Z",
    "headline": "US Supreme Court opens a new term on Monday",
    "summary": "The US Supreme Court begins its new term on Monday. The cases ahead include major tests on religion, guns and climate change. Alongside those, the court’s emergency docket keeps bringing in urgent requests.",
    "sources": [
      {
        "name": "NPR",
        "url": "https://www.npr.org/2026/10/03/nx-s1-5986341/supreme-court-term-religion-guns-environment-immigration"
      }
    ],
    "totals": {
      "good": 690,
      "bad": 802,
      "skip": 1415
    }
  },
  {
    "id": "sample-5",
    "topic": "Cities",
    "publishedAt": "2026-10-04T00:07:25Z",
    "headline": "New York’s mayor and the Irish PM ride the subway together",
    "summary": "New York City Mayor Zohran Mamdani shared a video of himself riding the subway with Irish Prime Minister Micheál Martin during UN week. The two also played bingo.",
    "sources": [
      {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/video/newsfeed/2026/10/4/mamdani-irish-pm-play-bingo-split-the-g-in-new-york"
      }
    ],
    "totals": {
      "good": 1530,
      "bad": 388,
      "skip": 910
    }
  },
  {
    "id": "sample-6",
    "topic": "Politics",
    "publishedAt": "2026-10-04T00:26:22Z",
    "headline": "Vucic launches campaign to become Serbia’s prime minister",
    "summary": "Aleksandar Vucic, Serbia’s former president, has started his campaign for prime minister. He is looking to stay in power through a parliamentary vote.",
    "sources": [
      {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/news/2026/10/4/serbian-populist-leader-vucic-launches-campaign-for-prime-minister"
      }
    ],
    "totals": {
      "good": 455,
      "bad": 960,
      "skip": 1244
    }
  },
  {
    "id": "sample-7",
    "topic": "Search",
    "publishedAt": "2026-10-03T23:03:44Z",
    "headline": "Air ambulance missing between Bermuda and Boston",
    "summary": "An air ambulance flying from Bermuda to Boston has gone missing. The US Coast Guard says it has sent air and surface crews to search for the plane near Nantucket.",
    "sources": [
      {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/news/2026/10/3/air-ambulance-missing-on-flight-from-bermuda-to-boston"
      }
    ],
    "totals": {
      "good": 96,
      "bad": 2240,
      "skip": 512
    }
  },
  {
    "id": "sample-8",
    "topic": "Wellbeing",
    "publishedAt": "2026-10-03T09:00:00Z",
    "headline": "A psychologist’s tip for nerves: ‘flush’ your mistakes",
    "summary": "Psychologist Cindra Kamphoff shares strategies for handling nerves before a high-stakes moment such as a race or a job interview. One is a “pretend flush”: imagining a mistake going down the toilet. The aim is to get past the jitters and build confidence in the moment.",
    "sources": [
      {
        "name": "NPR",
        "url": "https://www.npr.org/2026/10/03/nx-s1-5989391/a-hot-tip-to-battle-performance-anxiety-pretend-flush-a-mistake-down-the-toilet"
      }
    ],
    "totals": {
      "good": 1702,
      "bad": 240,
      "skip": 655
    }
  }
];
