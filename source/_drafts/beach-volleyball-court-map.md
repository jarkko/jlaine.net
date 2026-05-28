---
layout: post
title: 'A beach volleyball court map for the Nordics and Baltics'
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

It is a small site. A single page with a map, plus a couple of data files behind it. Nothing about it needs a server or a database, which is part of why I trust it to still work in five years.

The data comes from two sources. Finnish courts come from LIPAS, the national sports facility register run by the University of Jyväskylä. Everywhere else comes from OpenStreetMap. A short script pulls fresh data from both, merges them, and writes the file the map loads.

Each court keeps a link back to where it came from — to its LIPAS record, or to the OpenStreetMap object you can correct yourself if you spot a mistake. Attribution is shown in the sidebar (CC BY 4.0 for LIPAS, ODbL for OpenStreetMap), and the merged data file is downloadable from the map page, so anyone can audit it or build on top of it.

## Where it goes

There are obvious next steps. The non-Finland data is only as good as OpenStreetMap, which means some real courts are missing and some long-gone ones still linger. Estonia and Latvia in particular have national registers I would like to integrate. None of that is urgent. The map already does what I needed it to do.

What I like most about the project is something boring: the whole thing runs on open data, sits in a single git repository, deploys as static files, and depends on nothing I cannot read. If LIPAS or OpenStreetMap changes their schema, I will know within a script run. If my hosting goes away, anyone can clone the repo and put it back up in an afternoon. For a hobby project tied to a sport I care about, that is the right amount of infrastructure.
