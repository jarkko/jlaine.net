---
layout: post
title: "A beach volleyball court map for the Nordics and Baltics"
categories: [project, en]
---

I coach beach volleyball in Finland. Every spring the same conversation comes back. Where can we play this summer? Where do we send the team for a weekend camp? A player is driving through Estonia on holiday — is there a court they can stop at?

The answers exist. They are just scattered. So over the last few months I built a small thing that pulls them into one map: an interactive directory of indoor sand halls and outdoor sand courts across Finland, Sweden, Norway, Denmark, Iceland, Estonia, Latvia, and Lithuania. It lives at [/beach-volleyball/](/beach-volleyball/) on this site.

## What it is

A single page, a map, a sidebar list. Three buttons at the top: Indoor, Outdoor, Both. You can search by name or town, filter by country, click a marker, get an address, coordinates, and — when one exists — a link to the venue's own page or the open-data record it came from.

The indoor file is small and curated: dedicated sand halls, multi-activity beach venues, the occasional air dome that goes up in winter. Around forty venues, fact-checked one at a time. The outdoor file is the opposite end of the spectrum: roughly 3,500 courts, assembled from open data and not individually verified. The trade-off is honest. Indoor halls are rare enough that you can list them by hand. Outdoor courts are everywhere, and the only way to map them all is to trust the source data and document where it came from.

That is the whole feature. No accounts, no booking, no comments, no notifications. A map and a list.

## Why it was needed

Beach volleyball is a small sport in the Nordics, but it is not a tiny one. There are leagues, there are competitive juniors, there are adults who picked it up at thirty and now plan their summer weekends around finding sand. For Finnish courts, there is already a great answer: [LIPAS](https://www.lipas.fi/), the national sports facility register run by the University of Jyväskylä, with data released under CC BY 4.0. It knows where every officially registered Finnish court is. It does not, however, know about Estonia. Or Sweden. Or that camp your friend recommended in Klaipėda.

Outside Finland the picture fragments. National federations have varying levels of online presence. Some countries have their own registers (Estonia's spordiregister, Latvia's sporta bāzu reģistrs, Lithuania's sportoregistras) that I would like to integrate eventually, but they are not as easy to consume as LIPAS. The most consistent source across all the Nordic and Baltic countries turned out to be OpenStreetMap. Volunteers have been tagging sand pitches for years. The data is uneven — some countries are mapped better than others — but it is real, it is licensed openly under ODbL, and there is one query endpoint that reaches all of it.

So the itch was straightforward. I wanted a map I could send to a player, a parent, or a coach in any of those eight countries and have it work the same way for all of them. And I wanted the data behind it to be downloadable, attributable, and verifiable. Not a closed directory I had typed up and would forget to maintain.

## How it works

The stack is deliberately small. The site is Jekyll, the map page is a static HTML file with vanilla JavaScript and [Leaflet](https://leafletjs.com/). No build step beyond Jekyll itself. The map reads CSV files at runtime in the browser.

The data comes from two pipelines, both written in Python with only the standard library:

- `scripts/update_finland_outdoor_courts.py` pulls Finnish courts from the LIPAS API (type code 1330, "beachvolley-/rantalentopallokenttä"), filters to loose sand and active status, and writes them to a Finland-only CSV. There is also a small overrides file for cases where I want to correct something or add a venue LIPAS does not know about.
- `scripts/fetch_outdoor_osm.py` queries the [Overpass API](https://overpass-api.de/) for `leisure=pitch` combined with `sport=beachvolleyball` (and the legacy `beach_volleyball` alias, and the `sport=volleyball + surface=sand` mapping that some countries prefer) inside each country's administrative boundary.
- `scripts/build_nordic_outdoor_csv.py` glues the two sources together into a single `nordic_outdoor_beach_volleyball_courts.csv` that the page actually loads.

Each row keeps its origin. Finnish rows carry their `lipas_id` and link back to LIPAS. OSM rows carry a stable `w{way_id}` or `n{node_id}` and link back to the OSM object. Attribution is rendered in the sidebar — CC BY 4.0 for LIPAS, ODbL for OpenStreetMap — and the CSV is downloadable from the map page so anyone can audit or reuse it.

A couple of small details took more time than they should have. LIPAS sometimes models a multi-court venue as several separate records — a row per court, all at the same address — which means the same place shows up two or three times on the map. The Finland pipeline merges those into a single venue and records every original LIPAS id in a merged-id field. That sounds tidy until it hits the URL: `?venue=fi-out-509930%2C509931-…` is ugly and brittle. So the merged ids get hyphenated for permalinks: `fi-out-509930-509931-kupittaan-rantalentopallokentta`. The page reads either format, but the canonical one is the clean hyphenated slug.

The URL scheme itself is path-style: `/beach-volleyball/#/outdoor/fi-out-509930-509931-kupittaan-rantalentopallokentta` opens straight to outdoor mode with that specific court selected and the map zoomed in. `/#/indoor` and `/#/both` jump to the right view. A tiny inline script runs before paint so the correct mode button is highlighted on first render — without it, loading an outdoor permalink would briefly show the indoor view before the rest of the JavaScript caught up. Small thing, but it matters when you share a link.

Testing is split in two. Pure data and URL logic live in unit tests run under Node. The map itself, the sidebar, the search, the mode switch, the permalink resolution — those are covered by Playwright end-to-end tests that boot the page with real hash URLs and click around. That has caught more bugs than I expected, including most of the recent ones around merged LIPAS ids and pretty path hashes.

## Where it goes

There are obvious next steps. The non-Finland data is only as good as OpenStreetMap, which means some real courts are missing and some long-gone ones still linger. Estonia and Latvia in particular have national registers I would like to integrate. None of that is urgent. The map already does what I needed it to do.

What I like most about the project is something boring: the whole thing runs on open data, sits in a single git repository, deploys as static files, and depends on nothing I cannot read. If LIPAS or OpenStreetMap changes their schema, I will know within a script run. If my hosting goes away, anyone can clone the repo and put it back up in an afternoon. For a hobby project tied to a sport I care about, that is the right amount of infrastructure.
