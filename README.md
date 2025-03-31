# Remix Rodeo - April 2025

## Prompt

Build your version of the [Remix Austin website](https://remixaustin.com/).

We encourage you to unleash your creativity and push the boundaries of what's possible. Whether it's a quirky, off-the-wall concept, a polished and professional design, or a visionary glimpse into the future, we want to see your unique take on the Remix Austin website. Let your imagination run wild and build something that excites you. 

Feel free to use the tools, technologies, and libraries you are most comfortable with or want to explore. Try out new techniques, collaborate with others, and create a project that highlights your skills and creativity. This is an opportunity to learn, experiment, and build something unique. 

## Schedule

- 7:00-7:15p: Eat food & socialize  
- 7:15-7:45p: Make teams, plan your project  
- 7:45-8:45p: Build all the things!  
- 8:45-9:00p: Presentations  

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```
