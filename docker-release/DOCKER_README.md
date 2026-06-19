# Zad-AI Engine Running Guide

Welcome! This folder contains everything you need to run the Zad-AI engine along with its Redis memory locally as a Docker Container.
You don't need to install Python or any dependencies, just follow these simple steps:

## Prerequisites
1. Ensure that [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running in the background on your machine.

## How to Run

### Quick Start (One-Click)
1. Make sure **Docker Desktop** is open and running.
2. Double-click the `start-zad-ai.bat` file.
3. The script will automatically download the project image from the internet (Docker Hub) and start the server along with the Redis database.
4. Once it finishes loading, the server will be up and running. You can access the API documentation (Swagger UI) via this link:
   [http://localhost:8000/docs](http://localhost:8000/docs)

You can now connect your Flutter frontend (or Postman) directly to `http://localhost:8000`.

## Stopping the Server
If you want to stop the server at any time, open a Terminal or Command Prompt in this folder and type:
```bash
docker compose down
```
