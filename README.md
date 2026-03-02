# API Documenter

**API Documenter** is a powerful, self-hosted, offline-first alternative to Postman and Insomnia. It is designed for developers who need a robust API testing environment that works locally by default but scales into a team-oriented platform with secure database synchronization and granular access control.

![API Documenter](resources/icon.png)

## Key Features

- **Offline-First Desktop Environment**: Local performance with no cloud dependency for personal projects.
- **Secure Team Workspaces**: Connect to **PostgreSQL** or **MySQL** for team synchronization via a secure Vercel-hosted proxy.
- **Granular RBAC**: Manage Admins, Editors, and Viewers with folder-level permissions.
- **Advanced Request Engine**: Full support for all HTTP methods, headers, parameters, and bodies.
- **Premium Responsive UI**: A dark-themed, premium design with a custom font-scaling engine for perfect readability on any screen.
- **Automated Updates**: Integrated GitHub update system for seamless version management.

## Built With

- **Core**: Electron, React, TypeScript, Vite
- **Database**: mysql2, pg, Dexie (IndexedDB)
- **Styling**: Vanilla CSS (Custom Variable-based Scaling)
- **Deployment**: Vercel & GitHub Actions

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PraneethKulukuri26/API-Documenter.git
   cd API-Documenter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

If you discover any security-related issues, please refer to [SECURITY.md](SECURITY.md) for reporting instructions.
