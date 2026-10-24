# Milestone 5

This document should be completed and submitted during **Unit 9** of this course. You **must** check off all completed tasks in this document in order to receive credit for your work.

## Checklist

This unit, be sure to complete all tasks listed below. To complete a task, place an `x` between the brackets.

- [ ] Deploy your project on Render
  - [ ] In `readme.md`, add the link to your deployed project
- [ ] Update the status of issues in your project board as you complete them
- [ ] In `readme.md`, check off the features you have completed in this unit by adding a ✅ emoji in front of their title
  - [ ] Under each feature you have completed, **include a GIF** showing feature functionality
- [ ] In this document, complete the **Reflection** section below
- [ ] 🚩🚩🚩**Complete the Final Project Feature Checklist section below**, detailing each feature you completed in the project (ONLY include features you implemented, not features you planned)
- [ ] 🚩🚩🚩**Record a GIF showing a complete run-through of your app** that displays all the components included in the **Final Project Feature Checklist** below
  - [ ] Include this GIF in the **Final Demo GIF** section below

## Final Project Feature Checklist

Complete the checklist below detailing each baseline, custom, and stretch feature you completed in your project. This checklist will help graders look for each feature in the GIF you submit.

### Baseline Features

👉🏾👉🏾👉🏾 Check off each completed feature below.

- [x] The project includes an Express backend app and a React frontend app
- [x] The project includes these backend-specific features:
  - [x] At least one of each of the following database relationships in Postgres
    - [x] one-to-many (Users to Goals)
    - [x] many-to-many with a join table (Users to Games via UserGames)
  - [x] A well-designed RESTful API that:
    - [x] supports all four main request types for a single entity (GET, POST, PATCH, DELETE for Games/Sessions)
  - [x] Routes follow proper naming conventions
  - [x] The web app includes the ability to reset the database to its default state (Handled via schema.sql script)
- [x] The project includes these frontend-specific features:
  - [x] At least one redirection (Redirect to Dashboard on Login)
  - [x] At least one interaction that the user can initiate and complete on the same page (Updating game status in Library)
  - [x] Dynamic frontend routes created with React Router
  - [x] Hierarchically designed React components
- [x] The project includes dynamic routes for both frontend and backend apps
- [x] The project is deployed on Render

### Custom Features
- [x] The project gracefully handles errors (React error boundaries and Express try/catch)
- [x] The project includes a one-to-one database relationship (Users to Goals)
- [x] The project includes a slide-out pane or modal (Add Game Modal)
- [x] The project includes a unique field within the join table (user_id and game_id unique constraint)
- [x] The user can filter or sort items based on particular criteria (Library Status Filter)
- [x] Data submitted via a POST or PATCH request is validated (Strict TypeScript interfaces and backend validation)

## Final Demo GIF
[Insert link to full app walkthrough GIF here]

## Reflection

### 1. What went well during this unit?
The deployment process was streamlined by configuring the Express backend to serve the static Vite build, eliminating CORS issues in the production environment.

### 2. What were some challenges your group faced in this unit?
Provisioning the PostgreSQL database on Render and ensuring the `DATABASE_URL` environment variable was correctly passed to the Express connection pool required troubleshooting.

### 3. What were some of the highlights or achievements that you are most proud of in this project?
Implementing the Mood/Energy-Based Game Picker algorithm and strictly typing the entire full-stack application.

### 4. Reflecting on your web development journey so far, how have you grown since the beginning of the course?
Transitioned from writing isolated scripts to understanding system design, RESTful architectures, and complex relational database mapping.

### 5. Looking ahead, what are your goals related to web development, and what steps do you plan to take to achieve them?
Focus on learning advanced CI/CD pipelines, Docker containerization, and deeper optimization of React component rendering lifecycles.