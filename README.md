# Plane Game

This is a game built in JavaScript using the LittleJS game engine, deployed through the Vite framework.

The purpose is to demonstrate JavaScript coding syntax, web development and app deployment, and configuration as code via JSON customizations.

![alt text](screenshot.png)

## Custom Powerups and Enemies

You can add custom powerups and enemies to the game by adding additional JSON objects to the files in the data folder before building. More documentation on how to build these is coming, but for now just try to match the structure provided in the `default.json` files.

[LittleJS Custom Particle Effects Generator](https://killedbyapixel.github.io/LittleJS/examples/particles/)

[LittleJS Custom Sounds Generator](https://killedbyapixel.github.io/ZzFX/)

## Run the game locally

If you've downloaded the code for the game, you can run a local dev version this way:

```bash
npm install
npm run dev
```

Requires Node 22.12+, what the LittleJS package and its tools are tested on.

## Docker

You can run this game via a docker container.

Set up your .env file first from the provided .env.sample file to use your own custom powerup files.

### Build Your Own Image

```bash
docker build -t plane-game .
```

and then

```bash
docker run -p 8080:8080 plane-game --env-file=.env
```

### Compose File

You can also run via the included Docker Compose file:

```bash
docker compose -f .\compose.yml --env-file=.env up -d
```

## Vite commands

```bash
npm run dev       # dev server, the page reloads on save
npm run build     # build to dist/
npm run preview   # preview the production build
```

See the [Vite docs](https://vite.dev) for more.

## LittleJS

[Read the LittleJS docs to learn more](https://github.com/KilledByAPixel/LittleJS).

## Sprites

All sprites are from the incredible [Kenney.nl](https://kenney.nl/). Check them out!!

## Inspiration

The game was built from the basic principles provided in Eoin McGrath's wonderful [Little-Ski Tutorial](https://eoinmcgrath.com/little-ski/tutorial.html). Check it out for a great step-by-step guide to building your own game with LittleJS!
