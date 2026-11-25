# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Cloud deployment: load balancing and scaling

The AWS demo infrastructure for the Django API is documented in [infra/aws/README.md](infra/aws/README.md). It provisions an Application Load Balancer, EC2 Launch Template, Auto Scaling Group, target health checks, and CPU-based target tracking with Terraform. A small read-only k6 test is available in [loadtest/loadtest.js](loadtest/loadtest.js).

For local development, the frontend uses Vite's `/api` proxy. For a deployed frontend, set `VITE_API_BASE_URL` to the API URL output by Terraform before building. Do not use `127.0.0.1` in the deployed browser.
