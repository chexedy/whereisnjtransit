# where is NJ Transit?
If the link does not work, use https://whereisnjtransit.pages.dev/ 

If the site feels a bit slow, I apologize, as I know the optimization is not the best. If you run into any bugs, please open an issue to let me know. Also, keep in mind that the data may sometimes lag by about 30–60 seconds due to API delays. Unfortunately, not much I can do about that. However, if you notice data that’s significantly inaccurate beyond that, please report it as an issue.

## Introduction
This is an interactive map that allows you to:
- View every station and track served by NJ Transit
- View the departure times of any trains these stations service
- View estimated positions of currently active trains

The site uses NJ Transit's third-party API for its data. Unfortunately, the API is a bit behind when it comes to real-time information, which can cause the site to lag behind if there are delays. I primarily made it as a concept for an official NJ Transit map, as their current system does not have such a thing.

## Interactive Map
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/3003b1cf-a569-4d04-afd1-076cab22cce1" />
Select lines and view their tracks, stations, and trains

## Station Departure History
<img width="1920" height="1080" alt="transit" src="https://github.com/user-attachments/assets/61e1421d-2825-4edd-bf58-6611c7a87979" />
Select a station to see upcoming departures

## Currently Active Trains
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/2589048b-4c28-48ae-9665-f3eb9f37b5a0" />
Search trains by their ID and select one to jump to its current estimated position

## Tools Used
- MapLibre GL JS to display the map
- ProtoMaps for the map files
- Turf for some map calculations
- Cloudflare for:
  - Pages to host the site
  - Workers to fetch data from NJ Transit's API
  - D1 SQL Database to store both schedule and real-time data
  - R2 to store the map files
